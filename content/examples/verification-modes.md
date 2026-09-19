# Verification fixtures

These complete programs exercise every supported verification mode. They are build fixtures,
not lessons, and are never included in the browser dataset.

```kotlin compile id=kotlin-compile file=CompileOnly.kt
fun greeting(name: String): String = "Hello, $name"
```

```java compile id=java-compile file=CompileOnly.java
final class CompileOnly {
  static int twice(int value) { return value * 2; }
}
```

```kotlin run id=kotlin-run file=KotlinRun.kt main=KotlinRunKt expected=verified
fun main() = println("verified")
```

```java run id=java-run file=JavaRun.java main=JavaRun expected=verified
public final class JavaRun {
  public static void main(String[] args) { System.out.println("verified"); }
}
```

```kotlin compile id=mixed-boundary file=Message.kt
class Message { fun text(): String = "interop" }
```

```java compile id=mixed-boundary file=MixedBoundary.java
final class MixedBoundary {
  static String text() { return new Message().text(); }
}
```

```kotlin compile-fails id=type-mismatch file=TypeMismatch.kt category=type-mismatch
val number: Int = "not a number"
```

```kotlin fragment id=nullable-fragment file=NullableFragment.kt
val nickname: String? = null
```

```kotlin pseudocode id=search-pseudocode file=Search.kt
search concepts by matching their aliases
```
