# Terminal OS — règles ProGuard (minification désactivée pour l'instant)
-keepclassmembers class com.elganya.terminalos.** {
    @android.webkit.JavascriptInterface <methods>;
}
