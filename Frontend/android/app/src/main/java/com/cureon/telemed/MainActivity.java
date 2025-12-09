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
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.Plugin;
import com.permissionx.guolindev.PermissionX;
import com.permissionx.guolindev.callback.ExplainReasonCallback;
import com.permissionx.guolindev.callback.RequestCallback;
import com.permissionx.guolindev.request.ExplainScope;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "CureonMainActivity";
    private static final int PERMISSION_REQUEST_CODE = 100;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register the ZegoCallPlugin before super.onCreate
        registerPlugin(ZegoCallPlugin.class);
        
        super.onCreate(savedInstanceState);
        Log.d(TAG, "onCreate - Requesting permissions and setting up WebView");
        requestAllPermissions();
        requestSystemAlertWindowPermission();
        
        // Setup WebView for WebRTC immediately after creation
        // Use a small delay to ensure the bridge is ready
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            setupWebViewForWebRTC();
        }, 500);
    }

    private void requestSystemAlertWindowPermission() {
        PermissionX.init(this)
            .permissions(Manifest.permission.SYSTEM_ALERT_WINDOW)
            .onExplainRequestReason(new ExplainReasonCallback() {
                @Override
                public void onExplainReason(@NonNull ExplainScope scope, @NonNull List<String> deniedList) {
                    String message = "We need your consent for the following permissions in order to use the offline call function properly";
                    scope.showRequestReasonDialog(deniedList, message, "Allow", "Deny");
                }
            })
            .request(new RequestCallback() {
                @Override
                public void onResult(boolean allGranted, @NonNull List<String> grantedList,
                        @NonNull List<String> deniedList) {
                    Log.d(TAG, "SYSTEM_ALERT_WINDOW permission: " + (allGranted ? "GRANTED" : "DENIED"));
                }
            });
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "onResume - Setting up WebView for WebRTC");
        setupWebViewForWebRTC();
    }

    private void requestAllPermissions() {
        List<String> permissions = new ArrayList<>();
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
                != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.CAMERA);
        }
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) 
                != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.RECORD_AUDIO);
        }
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.MODIFY_AUDIO_SETTINGS) 
                != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.MODIFY_AUDIO_SETTINGS);
        }

        if (!permissions.isEmpty()) {
            Log.d(TAG, "Requesting permissions: " + permissions);
            ActivityCompat.requestPermissions(this, 
                permissions.toArray(new String[0]), PERMISSION_REQUEST_CODE);
        } else {
            Log.d(TAG, "All permissions already granted");
        }
    }

    private void setupWebViewForWebRTC() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView == null) {
                Log.e(TAG, "WebView is null");
                return;
            }

            WebSettings settings = webView.getSettings();

            // Essential for WebRTC
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);

            // Database and cache - Enhanced for better performance
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setDatabaseEnabled(true);
            settings.setAppCacheEnabled(true);

            // Mixed content for HTTPS/HTTP
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            }

            // Hardware acceleration - Enhanced
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);

            // Performance optimizations
            settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
            settings.setEnableSmoothTransition(true);

            // Geolocation support
            settings.setGeolocationEnabled(true);

            // Zoom and viewport settings
            settings.setSupportZoom(false);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            settings.setUseWideViewPort(true);
            settings.setLoadWithOverviewMode(true);

            // Enhanced rendering
            settings.setLoadsImagesAutomatically(true);
            settings.setBlockNetworkImage(false);

            // Modern web features
            settings.setSupportMultipleWindows(false);
            settings.setAllowUniversalAccessFromFileURLs(false);
            settings.setAllowFileAccessFromFileURLs(false);

            // Custom WebChromeClient that extends Capacitor's and handles WebRTC permissions
            webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    Log.d(TAG, "WebRTC Permission Request: " + Arrays.toString(request.getResources()));
                    
                    // Check Android permissions
                    boolean hasCam = ContextCompat.checkSelfPermission(MainActivity.this, 
                        Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
                    boolean hasMic = ContextCompat.checkSelfPermission(MainActivity.this, 
                        Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;

                    Log.d(TAG, "Android permissions - Camera: " + hasCam + ", Mic: " + hasMic);

                    // Filter requested resources based on what we have permission for
                    List<String> grantedResources = new ArrayList<>();
                    for (String resource : request.getResources()) {
                        if (resource.equals(PermissionRequest.RESOURCE_VIDEO_CAPTURE) && hasCam) {
                            grantedResources.add(resource);
                        } else if (resource.equals(PermissionRequest.RESOURCE_AUDIO_CAPTURE) && hasMic) {
                            grantedResources.add(resource);
                        } else if (!resource.equals(PermissionRequest.RESOURCE_VIDEO_CAPTURE) 
                                && !resource.equals(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                            // Grant other resources (like protected media)
                            grantedResources.add(resource);
                        }
                    }

                    if (hasCam && hasMic) {
                        // All permissions granted, grant all requested resources
                        runOnUiThread(() -> {
                            Log.d(TAG, "Granting all WebRTC permissions");
                            request.grant(request.getResources());
                        });
                    } else if (!grantedResources.isEmpty()) {
                        // Grant what we can
                        runOnUiThread(() -> {
                            Log.d(TAG, "Granting partial WebRTC permissions: " + grantedResources);
                            request.grant(grantedResources.toArray(new String[0]));
                        });
                        // Request missing permissions
                        if (!hasCam || !hasMic) {
                            requestAllPermissions();
                        }
                    } else {
                        // No permissions, request them and grant anyway to avoid blocking
                        Log.d(TAG, "No permissions, requesting and granting anyway");
                        requestAllPermissions();
                        runOnUiThread(() -> {
                            request.grant(request.getResources());
                        });
                    }
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error setting up WebView for WebRTC", e);
        }
    }
}
