package com.elganya.terminalos;

import android.app.Application;

/**
 * Terminal OS — point d'entrée applicatif.
 * Volontairement minimal : l'application est un hôte WebView + un pont natif.
 */
public class TerminalOsApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        // Les moteurs locaux (Ollama) et les passerelles cloud passent par le
        // pont natif (ELG.http) : pas de CORS, pas de blocage cleartext WebView.
    }
}
