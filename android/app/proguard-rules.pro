# Add project specific ProGuard rules here.

# React Native optimizations
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep React Native bridge classes
-keep class * extends com.facebook.react.bridge.ReactContextBaseJavaModule { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# Push Notification
-keep class com.dieam.reactnativepushnotification.** { *; }

# Remove all logging in release builds for smaller size
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# Safe optimizations (less aggressive to prevent crashes)
-optimizationpasses 3
-dontobfuscate

# Keep React Native classes safe
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.modules.** { *; }

# Remove unused code safely
-dontwarn com.facebook.react.**
-dontwarn okio.**
-dontwarn javax.annotation.**

# Keep line numbers for crash reports
-keepattributes SourceFile,LineNumberTable