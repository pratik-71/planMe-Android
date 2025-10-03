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

# More aggressive optimizations for smaller size
-optimizationpasses 5
-dontobfuscate
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-allowaccessmodification
-repackageclasses ''

# Keep React Native classes safe
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.modules.** { *; }

# Remove unused code safely
-dontwarn com.facebook.react.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# Keep line numbers for crash reports
-keepattributes SourceFile,LineNumberTable

# Notifee optimization
-keep class app.notifee.** { *; }
-keep class io.invertase.notifee.** { *; }

# Supabase optimization
-keep class io.supabase.** { *; }
-dontwarn io.supabase.**

# Google Sign-In optimization  
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**