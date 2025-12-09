package com.cureon.telemed;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "MainActivity";
    private static final int PERMISSION_REQUEST_CODE = 1001;
    
    private String[] requiredPermissions = {
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.MODIFY_AUDIO_SETTINGS
    };
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Request permissions on app start
        requestRequiredPermissions();
    }
    
    @Override
    public void onStart() {
        super.onStart();
        
        // Configure WebView for WebRTC
        configureWebView();
    }
    
    private void requestRequiredPermissions() {
        List<String> permissionsToRequest = new ArrayList<>();
        
        for (String permission : requiredPermissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission);
            }
        }
        
        if (!permissionsToRequest.isEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toArray(new String[0]),
                PERMISSION_REQUEST_CODE
            );
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            for (int i = 0; i < permissions.length; i++) {
                if (grantResults[i] == PackageManager.PERMISSION_GRANTED) {
                    Log.d(TAG, "Permission granted: " + permissions[i]);
                } else {
                    Log.w(TAG, "Permission denied: " + permissions[i]);
                }
            }
        }
    }
    
    private void configureWebView() {
        try {
            WebView webView = getBridge().getWebView();
            
            if (webView != null) {
                // Configure WebView settings for WebRTC
                WebSettings settings = webView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setDomStorageEnabled(true);
                settings.setAllowFileAccess(true);
                settings.setAllowContentAccess(true);
                settings.setJavaScriptCanOpenWindowsAutomatically(true);
                
                // Enable mixed content for development
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                }
                
                // Set WebChromeClient to handle permission requests
                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        Log.d(TAG, "WebView permission request: " + java.util.Arrays.toString(request.getResources()));
                        
                        // Auto-grant all WebRTC permissions
                        runOnUiThread(() -> {
                            try {
                                request.grant(request.getResources());
                                Log.d(TAG, "WebView permissions granted");
                            } catch (Exception e) {
                                Log.e(TAG, "Error granting permissions: " + e.getMessage());
                            }
                        });
                    }
                    
                    @Override
                    public void onPermissionRequestCanceled(PermissionRequest request) {
                        Log.d(TAG, "WebView permission request canceled");
                        super.onPermissionRequestCanceled(request);
                    }
                });
                
                Log.d(TAG, "WebView configured for WebRTC");
            } else {
                Log.w(TAG, "WebView is null");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error configuring WebView: " + e.getMessage());
        }
    }
}
