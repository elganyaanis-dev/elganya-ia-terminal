package com.elganya.orchestrator;

import android.app.Activity;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.concurrent.TimeUnit;

/**
 * Terminal réel de Terminal OS : `/system/bin/sh` (toybox) exécuté sous l'UID
 * de l'application. Pas de root, pas de binaires Termux (autre UID), mais un
 * vrai shell : cd, ls, cat, echo, grep, sed, tar, curl (si présent)…
 *
 * Deux modes :
 *  - exec(cmd)  : one-shot bloquant, retourne la sortie complète
 *  - start/write/stop : session interactive persistante (cd conservé)
 */
public class ShellBridge {

    private final Activity activity;
    private final WebView web;
    private Process proc;
    private BufferedWriter stdin;
    private volatile boolean running;

    public ShellBridge(Activity activity, WebView web) {
        this.activity = activity;
        this.web = web;
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

    private ProcessBuilder builder() {
        ProcessBuilder pb = new ProcessBuilder("/system/bin/sh");
        pb.redirectErrorStream(true);
        File home = new File(activity.getFilesDir(), "workspace");
        if (!home.exists()) home.mkdirs();
        pb.directory(home);
        pb.environment().put("PATH", "/system/bin:/system/xbin:/vendor/bin:/product/bin");
        pb.environment().put("HOME", home.getAbsolutePath());
        pb.environment().put("TMPDIR", activity.getCacheDir().getAbsolutePath());
        pb.environment().put("TERM", "xterm-256color");
        pb.environment().put("PS1", "tos $ ");
        return pb;
    }

    /** Session interactive : la sortie arrive dans window.TOS.onShellOut(texte). */
    @JavascriptInterface
    public void start() {
        if (running) return;
        try {
            proc = builder().start();
            stdin = new BufferedWriter(new OutputStreamWriter(proc.getOutputStream(), "UTF-8"));
            running = true;
            final Process p = proc;
            new Thread(() -> {
                try {
                    BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream(), "UTF-8"));
                    char[] buf = new char[2048];
                    int n;
                    while ((n = r.read(buf)) > 0) {
                        push("window.TOS && window.TOS.onShellOut(" + q(new String(buf, 0, n)) + ");");
                    }
                } catch (Exception ignored) {
                } finally {
                    running = false;
                    push("window.TOS && window.TOS.onShellExit();");
                }
            }).start();
        } catch (Exception e) {
            push("window.TOS && window.TOS.onShellOut(" + q("shell: " + e.getMessage() + "\n") + ");");
        }
    }

    @JavascriptInterface
    public void write(String data) {
        try {
            if (!running || stdin == null) start();
            if (stdin != null) {
                stdin.write(data);
                stdin.flush();
            }
        } catch (Exception e) {
            push("window.TOS && window.TOS.onShellOut(" + q("shell: " + e.getMessage() + "\n") + ");");
        }
    }

    @JavascriptInterface
    public void stop() {
        running = false;
        try {
            if (stdin != null) stdin.close();
        } catch (Exception ignored) {
        }
        if (proc != null) proc.destroy();
        proc = null;
        stdin = null;
    }

    @JavascriptInterface
    public boolean isRunning() {
        return running;
    }

    /** Commande unique, bloquante (max 25 s). */
    @JavascriptInterface
    public String exec(String cmd) {
        JSONObject o = new JSONObject();
        Process p = null;
        try {
            p = new ProcessBuilder("/system/bin/sh", "-c", cmd)
                    .redirectErrorStream(true)
                    .directory(new File(activity.getFilesDir(), "workspace"))
                    .start();
            StringBuilder sb = new StringBuilder();
            BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream(), "UTF-8"));
            char[] buf = new char[4096];
            int n;
            long deadline = System.currentTimeMillis() + 25000;
            while ((n = r.read(buf)) > 0) {
                sb.append(buf, 0, n);
                if (System.currentTimeMillis() > deadline) {
                    sb.append("\n[timeout 25s]");
                    break;
                }
            }
            boolean done = p.waitFor(25, TimeUnit.SECONDS);
            if (!done) p.destroy();
            o.put("out", sb.toString());
            o.put("code", done ? p.exitValue() : 124);
        } catch (Exception e) {
            try {
                o.put("out", "erreur: " + e.getMessage());
                o.put("code", -1);
            } catch (Exception ignored) {
            }
        } finally {
            if (p != null) p.destroy();
        }
        return o.toString();
    }
}
