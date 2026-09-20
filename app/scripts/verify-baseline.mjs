import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ContentValidationError } from './content-pipeline.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = path.resolve(scriptDirectory, '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(repositoryDirectory, 'content/curriculum.json'), 'utf8'));
const properties = Object.fromEntries(fs.readFileSync(
  path.join(repositoryDirectory, 'examples/gradle/verification-baseline.properties'),
  'utf8'
).split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => {
    const separator = line.indexOf('=');
    return [line.slice(0, separator), line.slice(separator + 1)];
  }));
const buildScript = fs.readFileSync(path.join(repositoryDirectory, 'examples/build.gradle'), 'utf8');
const wrapperProperties = fs.readFileSync(
  path.join(repositoryDirectory, 'examples/gradle/wrapper/gradle-wrapper.properties'),
  'utf8'
);

const expected = {
  baselineId: manifest.baseline.id,
  previousBaselineId: manifest.baseline.previousId ?? '',
  adoptedAt: manifest.baseline.adoptedAt,
  upgradeRationale: manifest.baseline.upgradeRationale,
  sourceUrl: manifest.baseline.sourceUrl,
  kotlinCompiler: manifest.baseline.kotlinCompiler,
  kotlinGradlePlugin: manifest.baseline.kotlinCompiler,
  kotlinLanguageVersion: manifest.baseline.languageVersion,
  kotlinApiVersion: manifest.baseline.apiVersion,
  jvmTarget: manifest.baseline.jvmTarget,
  gradle: manifest.baseline.gradle,
  coroutines: manifest.baseline.coroutines,
  jdk: manifest.baseline.jdk,
  jdkArtifact: manifest.baseline.jdk
};
const issues = Object.entries(expected)
  .filter(([key, value]) => properties[key] !== String(value))
  .map(([key, value]) => `verification-baseline.properties: ${key} must match curriculum baseline value "${value}"`);
const kotlinVersionConstant = manifest.baseline.languageVersion.replace('.', '_');
const jdkMajor = manifest.baseline.jdk.match(/Temurin (\d+)/)?.[1];
const requiredBuildConfiguration = [
  `id 'org.jetbrains.kotlin.jvm' version '${manifest.baseline.kotlinCompiler}'`,
  `languageVersion = JavaLanguageVersion.of(${jdkMajor})`,
  `jvmToolchain(${jdkMajor})`,
  `languageVersion = KotlinVersion.KOTLIN_${kotlinVersionConstant}`,
  `apiVersion = KotlinVersion.KOTLIN_${manifest.baseline.apiVersion.replace('.', '_')}`,
  `jvmTarget = JvmTarget.JVM_${manifest.baseline.jvmTarget}`,
  `org.jetbrains.kotlinx:kotlinx-coroutines-core:${manifest.baseline.coroutines}`,
  `org.jetbrains.kotlinx:kotlinx-coroutines-jdk8:${manifest.baseline.coroutines}`,
  `org.jetbrains.kotlin:kotlin-compiler-embeddable:${manifest.baseline.kotlinCompiler}`,
  `'${manifest.baseline.jdk.split(' ').at(-1)}'`,
  `args '-language-version', '${manifest.baseline.languageVersion}', '-api-version', '${manifest.baseline.apiVersion}', '-jvm-target', '${manifest.baseline.jvmTarget}'`
];

for (const configuration of requiredBuildConfiguration) {
  if (!buildScript.includes(configuration)) {
    issues.push(`examples/build.gradle: effective toolchain must contain ${JSON.stringify(configuration)}`);
  }
}
if (!wrapperProperties.includes(`/gradle-${manifest.baseline.gradle}-bin.zip`)) {
  issues.push(`gradle-wrapper.properties: distribution must use Gradle ${manifest.baseline.gradle}`);
}

if (issues.length > 0) throw new ContentValidationError(issues);

console.log(`Verified deliberate baseline ${manifest.baseline.id} adopted ${manifest.baseline.adoptedAt}.`);
