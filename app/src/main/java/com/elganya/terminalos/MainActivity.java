package com.elganya.terminalos;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.ConsoleMessage;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Hôte unique de Terminal OS.
 * La couche UI vit dans assets/ (HTML/CSS/JS). Deux ponts natifs :
 *   ELG    — réseau, stockage, fichiers, appareil
 *   ELGSH  — terminal
 */
public class MainActivity extends Activity {

    private static final int REQ_FILE = 1001;

    private WebView web;
    private ValueCallback<Uri[]> pendingFiles;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(false);
        s.setBuiltInZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        web.setBackgroundColor(0xFF0B0910);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (u == null) return false;
                String scheme = u.getScheme();
                if ("file".equals(scheme) || "about".equals(scheme)) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (Exception ignored) {
                }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb,
                                             FileChooserParams params) {
                pendingFiles = cb;
                try {
                    Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType("*/*");
                    if (params != null && params.getAcceptTypes() != null
                            && params.getAcceptTypes().length > 0
                            && params.getAcceptTypes()[0] != null
                            && params.getAcceptTypes()[0].length() > 0) {
                        i.putExtra(Intent.EXTRA_MIME_TYPES, params.getAcceptTypes());
                    }
                    startActivityForResult(Intent.createChooser(i, "Choisir un fichier"), REQ_FILE);
                } catch (Exception e) {
                    pendingFiles = null;
                    return false;
                }
                return true;
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage cm) {
                // Les logs JS remontent dans logcat : utile pour déboguer sans PC.
                android.util.Log.d("TerminalOS", cm.message() + " @" + cm.lineNumber());
                return true;
            }
        });

        web.addJavascriptInterface(new WebBridge(this, web), "ELG");
        web.addJavascriptInterface(new ShellBridge(this, web), "ELGSH");

        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_FILE) {
            if (pendingFiles != null) {
                Uri[] result = null;
                if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                    result = new Uri[]{data.getData()};
                }
                pendingFiles.onReceiveValue(result);
                pendingFiles = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            // Le routeur JS décide : retour d'écran, fermeture de modale, ou sortie.
            web.evaluateJavascript(
                    "(function(){try{return window.TOS?window.TOS.handleBack():false}catch(e){return false}})()",
                    value -> {
                        if (!"true".equals(value)) {
                            moveTaskToBack(true);
                        }
                    });
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        try {
            web.destroy();
        } catch (Exception ignored) {
        }
        super.onDestroy();
    }
}
