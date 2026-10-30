package com.elganya.orchestrator;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.StatFs;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Iterator;
import java.util.Map;

/**
 * Pont natif principal exposé au JavaScript sous le nom `ELG`.
 *
 * Rôle : tout ce qu'une page `file://` ne peut pas faire de façon fiable.
 *  - HTTP/HTTPS natif (aucun CORS, HTTP en clair autorisé vers le LAN/local)
 *  - streaming SSE / NDJSON pour le chat
 *  - stockage clé/valeur persistant (clés API, réglages, chaîne de modèles)
 *  - système de fichiers du workspace
 *  - infos appareil, presse-papier, partage, ouverture d'URL
 */
public class WebBridge {

    private final Activity activity;
    private final WebView web;
    private final SharedPreferences prefs;
    private final File workspace;

    public WebBridge(Activity activity, WebView web) {
        this.activity = activity;
        this.web = web;
        this.prefs = activity.getSharedPreferences("terminal_os", Context.MODE_PRIVATE);
        File ws = new File(activity.getFilesDir(), "workspace");
        if (!ws.exists()) ws.mkdirs();
        this.workspace = ws;
    }

    private void push(final String js) {
        activity.runOnUiThread(() -> {
            try {
                web.evaluateJavascript(js, null);
            } catch (Exception ignored) {
            }
        });
    }

    private static String q(String s) {
        return JSONObject.quote(s == null ? "" : s);
    }

    // ─────────────────────────── STOCKAGE ───────────────────────────

    @JavascriptInterface
    public String storeGet(String key, String def) {
        return prefs.getString(key, def);
    }

    @JavascriptInterface
    public void storeSet(String key, String value) {
        prefs.edit().putString(key, value).apply();
    }

    @JavascriptInterface
    public void storeRemove(String key) {
        prefs.edit().remove(key).apply();
    }

    @JavascriptInterface
    public String storeAll() {
        JSONObject o = new JSONObject();
        try {
            for (Map.Entry<String, ?> e : prefs.getAll().entrySet()) {
                o.put(e.getKey(), String.valueOf(e.getValue()));
            }
        } catch (Exception ignored) {
        }
        return o.toString();
    }

    // ─────────────────────────── RÉSEAU ───────────────────────────

    private HttpURLConnection open(String method, String urlStr, String headersJson, int timeoutMs)
            throws Exception {
        URL u = new URL(urlStr);
        HttpURLConnection c = (HttpURLConnection) u.openConnection();
        c.setRequestMethod(method == null ? "GET" : method.toUpperCase());
        c.setConnectTimeout(timeoutMs <= 0 ? 15000 : Math.min(timeoutMs, 30000));
        c.setReadTimeout(timeoutMs <= 0 ? 180000 : timeoutMs);
        c.setInstanceFollowRedirects(true);
        c.setRequestProperty("User-Agent", "TerminalOS/1.0 (Android)");
        c.setRequestProperty("Accept", "*/*");
        if (headersJson != null && headersJson.trim().length() > 1) {
            JSONObject h = new JSONObject(headersJson);
            Iterator<String> it = h.keys();
            while (it.hasNext()) {
                String k = it.next();
                String v = h.optString(k, "");
                if (v != null && v.length() > 0) c.setRequestProperty(k, v);
            }
        }
        return c;
    }

    private static String readAll(InputStream is) throws Exception {
        if (is == null) return "";
        BufferedReader r = new BufferedReader(new InputStreamReader(is, "UTF-8"));
        StringBuilder sb = new StringBuilder();
        char[] buf = new char[8192];
        int n;
        while ((n = r.read(buf)) > 0) sb.append(buf, 0, n);
        r.close();
        return sb.toString();
    }

    /** Requête bloquante. Retourne {"status":200,"body":"..."} ou {"status":0,"error":"..."}. */
    @JavascriptInterface
    public String http(String method, String urlStr, String headersJson, String body, int timeoutMs) {
        HttpURLConnection c = null;
        try {
            c = open(method, urlStr, headersJson, timeoutMs);
            if (body != null && body.length() > 0 && !"GET".equalsIgnoreCase(method)) {
                c.setDoOutput(true);
                byte[] b = body.getBytes("UTF-8");
                c.setFixedLengthStreamingMode(b.length);
                OutputStream os = c.getOutputStream();
                os.write(b);
                os.flush();
                os.close();
            }
            int code = c.getResponseCode();
            InputStream is = code >= 400 ? c.getErrorStream() : c.getInputStream();
            JSONObject out = new JSONObject();
            out.put("status", code);
            out.put("body", readAll(is));
            return out.toString();
        } catch (Exception e) {
            JSONObject out = new JSONObject();
            try {
                out.put("status", 0);
                out.put("body", "");
                out.put("error", e.getClass().getSimpleName() + ": " + e.getMessage());
            } catch (Exception ignored) {
            }
            return out.toString();
        } finally {
            if (c != null) c.disconnect();
        }
    }

    /**
     * Streaming ligne par ligne (SSE `data: {...}` ou NDJSON Ollama).
     * Rappels JS : TOS.onStreamMeta(id, status), TOS.onStreamChunk(id, texte),
     * TOS.onStreamEnd(id, erreurOuVide).
     */
    @JavascriptInterface
    public void httpStream(final String cbId, final String method, final String urlStr,
                           final String headersJson, final String body) {
        new Thread(() -> {
            HttpURLConnection c = null;
            try {
                c = open(method, urlStr, headersJson, 180000);
                if (body != null && body.length() > 0) {
                    c.setDoOutput(true);
                    byte[] b = body.getBytes("UTF-8");
                    c.setFixedLengthStreamingMode(b.length);
                    OutputStream os = c.getOutputStream();
                    os.write(b);
                    os.flush();
                    os.close();
                }
                int code = c.getResponseCode();
                push("window.TOS && window.TOS.onStreamMeta(" + q(cbId) + "," + code + ");");
                InputStream is = code >= 400 ? c.getErrorStream() : c.getInputStream();
                BufferedReader r = new BufferedReader(new InputStreamReader(is, "UTF-8"));
                StringBuilder batch = new StringBuilder();
                long last = System.currentTimeMillis();
                String line;
                while ((line = r.readLine()) != null) {
                    batch.append(line).append('\n');
                    long now = System.currentTimeMillis();
                    if (now - last > 60) {
                        push("window.TOS && window.TOS.onStreamChunk(" + q(cbId) + "," + q(batch.toString()) + ");");
                        batch.setLength(0);
                        last = now;
                    }
                }
                if (batch.length() > 0) {
                    push("window.TOS && window.TOS.onStreamChunk(" + q(cbId) + "," + q(batch.toString()) + ");");
                }
                r.close();
                push("window.TOS && window.TOS.onStreamEnd(" + q(cbId) + ",\"\");");
            } catch (Exception e) {
                push("window.TOS && window.TOS.onStreamEnd(" + q(cbId) + "," +
                        q(e.getClass().getSimpleName() + ": " + e.getMessage()) + ");");
            } finally {
                if (c != null) c.disconnect();
            }
        }).start();
    }

    // ─────────────────────────── FICHIERS ───────────────────────────

    private File resolve(String path) {
        if (path == null || path.isEmpty() || "/".equals(path)) return workspace;
        File f = new File(path);
        if (f.isAbsolute()) return f;
        return new File(workspace, path);
    }

    @JavascriptInterface
    public String fsHome() {
        return workspace.getAbsolutePath();
    }

    @JavascriptInterface
    public String fsList(String path) {
        JSONArray arr = new JSONArray();
        try {
            File dir = resolve(path);
            File[] kids = dir.listFiles();
            if (kids == null) {
                JSONObject err = new JSONObject();
                err.put("error", "Dossier illisible : " + dir.getAbsolutePath());
                return err.toString();
            }
            java.util.Arrays.sort(kids, (a, b) -> {
                if (a.isDirectory() && !b.isDirectory()) return -1;
                if (!a.isDirectory() && b.isDirectory()) return 1;
                return a.getName().compareToIgnoreCase(b.getName());
            });
            for (File f : kids) {
                JSONObject o = new JSONObject();
                o.put("name", f.getName());
                o.put("path", f.getAbsolutePath());
                o.put("dir", f.isDirectory());
                o.put("size", f.length());
                o.put("mtime", f.lastModified());
                arr.put(o);
            }
        } catch (Exception e) {
            return "{\"error\":" + q(e.getMessage()) + "}";
        }
        return arr.toString();
    }

    @JavascriptInterface
    public String fsRead(String path) {
        try {
            File f = resolve(path);
            if (!f.exists()) return "{\"error\":\"Fichier absent\"}";
            if (f.length() > 3 * 1024 * 1024) return "{\"error\":\"Fichier trop volumineux (>3 Mo)\"}";
            byte[] data = new byte[(int) f.length()];
            FileInputStream in = new FileInputStream(f);
            int read = in.read(data);
            in.close();
            JSONObject o = new JSONObject();
            o.put("content", new String(data, 0, Math.max(read, 0), "UTF-8"));
            o.put("path", f.getAbsolutePath());
            o.put("size", f.length());
            return o.toString();
        } catch (Exception e) {
            return "{\"error\":" + q(e.getMessage()) + "}";
        }
    }

    @JavascriptInterface
    public String fsWrite(String path, String content) {
        try {
            File f = resolve(path);
            File parent = f.getParentFile();
            if (parent != null && !parent.exists()) parent.mkdirs();
            FileOutputStream out = new FileOutputStream(f);
            out.write(content.getBytes("UTF-8"));
            out.close();
            JSONObject o = new JSONObject();
            o.put("ok", true);
            o.put("path", f.getAbsolutePath());
            o.put("size", f.length());
            return o.toString();
        } catch (Exception e) {
            return "{\"ok\":false,\"error\":" + q(e.getMessage()) + "}";
        }
    }

    @JavascriptInterface
    public String fsMkdir(String path) {
        File f = resolve(path);
        boolean ok = f.exists() || f.mkdirs();
        return "{\"ok\":" + ok + ",\"path\":" + q(f.getAbsolutePath()) + "}";
    }

    @JavascriptInterface
    public String fsDelete(String path) {
        File f = resolve(path);
        boolean ok = deleteRec(f);
        return "{\"ok\":" + ok + "}";
    }

    private static boolean deleteRec(File f) {
        if (f == null || !f.exists()) return false;
        if (f.isDirectory()) {
            File[] kids = f.listFiles();
            if (kids != null) for (File k : kids) deleteRec(k);
        }
        return f.delete();
    }

    /** Lit un content:// (fichier choisi par l'utilisateur) et le renvoie en base64. */
    @JavascriptInterface
    public String readUri(String uriStr) {
        try {
            Uri uri = Uri.parse(uriStr);
            InputStream is = activity.getContentResolver().openInputStream(uri);
            java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            long total = 0;
            while ((n = is.read(buf)) > 0) {
                total += n;
                if (total > 12 * 1024 * 1024) {
                    is.close();
                    return "{\"error\":\"Fichier > 12 Mo\"}";
                }
                bos.write(buf, 0, n);
            }
            is.close();
            String mime = activity.getContentResolver().getType(uri);
            String name = uri.getLastPathSegment();
            JSONObject o = new JSONObject();
            o.put("name", name == null ? "fichier" : name);
            o.put("mime", mime == null ? "application/octet-stream" : mime);
            o.put("size", total);
            o.put("base64", Base64.encodeToString(bos.toByteArray(), Base64.NO_WRAP));
            return o.toString();
        } catch (Exception e) {
            return "{\"error\":" + q(e.getMessage()) + "}";
        }
    }

    // ─────────────────────────── APPAREIL / UI ───────────────────────────

    @JavascriptInterface
    public String device() {
        JSONObject o = new JSONObject();
        try {
            ActivityManager am = (ActivityManager) activity.getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
            if (am != null) am.getMemoryInfo(mi);
            StatFs st = new StatFs(activity.getFilesDir().getAbsolutePath());
            o.put("model", Build.MANUFACTURER + " " + Build.MODEL);
            o.put("android", Build.VERSION.RELEASE);
            o.put("sdk", Build.VERSION.SDK_INT);
            o.put("abi", Build.SUPPORTED_ABIS.length > 0 ? Build.SUPPORTED_ABIS[0] : "?");
            o.put("cores", Runtime.getRuntime().availableProcessors());
            o.put("ramTotal", mi.totalMem);
            o.put("ramFree", mi.availMem);
            o.put("storageFree", st.getAvailableBytes());
            o.put("storageTotal", st.getTotalBytes());
            o.put("version", BuildConfig.VERSION_NAME);
            o.put("workspace", workspace.getAbsolutePath());
        } catch (Exception e) {
            try {
                o.put("error", e.getMessage());
            } catch (Exception ignored) {
            }
        }
        return o.toString();
    }

    @JavascriptInterface
    public void toast(final String msg) {
        activity.runOnUiThread(() ->
                android.widget.Toast.makeText(activity, msg, android.widget.Toast.LENGTH_SHORT).show());
    }

    @JavascriptInterface
    public void openUrl(String url) {
        try {
            activity.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (Exception ignored) {
        }
    }

    @JavascriptInterface
    public void share(String text) {
        try {
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("text/plain");
            i.putExtra(Intent.EXTRA_TEXT, text);
            activity.startActivity(Intent.createChooser(i, "Partager"));
        } catch (Exception ignored) {
        }
    }

    @JavascriptInterface
    public void copy(String text) {
        try {
            ClipboardManager cm = (ClipboardManager) activity.getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("Terminal OS", text));
        } catch (Exception ignored) {
        }
    }

    @JavascriptInterface
    public void exitApp() {
        activity.runOnUiThread(() -> activity.moveTaskToBack(true));
    }
}
