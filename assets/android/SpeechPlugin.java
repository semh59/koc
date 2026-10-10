package com.neowell.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

/** Voice prompts for guided mode. speechSynthesis makes no sound in the Android WebView, so the native TextToSpeech is used.
 *  If the engine or voice is missing there is no error: spoken:false is returned and the app continues silently. */
@CapacitorPlugin(name = "Speech")
public class SpeechPlugin extends Plugin {
    private static final AudioAttributes ATTRS = new AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
        .build();
    /** The command texts of guidelib.js stay below this length (guide.test.js). */
    private static final int SHORT = 20;
    private TextToSpeech tts;
    private volatile boolean ready;
    private volatile String lastId = "";
    private int seq;
    private AudioManager am;
    private Object focusReq; // AudioFocusRequest, API 26+
    private final AudioManager.OnAudioFocusChangeListener focusListener = change -> {};

    @Override
    public void load() {
        am = getContext().getSystemService(AudioManager.class);
        // onInit is asynchronous; if the engine cannot bind it can be called inside the constructor with ERROR, and the tts field is not touched on that path.
        tts = new TextToSpeech(getContext(), status -> {
            if (status != TextToSpeech.SUCCESS || tts == null) return;
            Locale tr = Locale.forLanguageTag("tr-TR");
            if (tts.isLanguageAvailable(tr) >= TextToSpeech.LANG_AVAILABLE) tts.setLanguage(tr);
            tts.setAudioAttributes(ATTRS);
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) {}
                @Override public void onDone(String id) { release(id); }
                @Override public void onError(String id) { release(id); }
                @Override public void onStop(String id, boolean interrupted) { release(id); }
            });
            ready = true;
        });
    }

    /** With queued commands, focus is abandoned only when the last utterance ends; an interrupted older one must not bring the music back early. */
    private void release(String id) {
        if (lastId.equals(id)) abandonFocus();
    }

    private void requestFocus() {
        if (Build.VERSION.SDK_INT >= 26) {
            if (focusReq == null) focusReq = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                .setAudioAttributes(ATTRS).setOnAudioFocusChangeListener(focusListener).build();
            am.requestAudioFocus((AudioFocusRequest) focusReq);
        } else {
            am.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
        }
    }

    private void abandonFocus() {
        if (Build.VERSION.SDK_INT >= 26) {
            if (focusReq != null) am.abandonAudioFocusRequest((AudioFocusRequest) focusReq);
        } else {
            am.abandonAudioFocus(focusListener);
        }
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        JSObject r = new JSObject();
        boolean ok = false;
        if (ready && text != null && !text.isEmpty()) {
            String id = "nw" + (++seq);
            lastId = id;
            requestFocus();
            // A short command ("3, 2, 1, başla", "Duraklatıldı") is queued behind the sentence being spoken and does not cut it; a new phase sentence (Next/Back) cuts the outdated one.
            int mode = text.length() <= SHORT ? TextToSpeech.QUEUE_ADD : TextToSpeech.QUEUE_FLUSH;
            ok = tts.speak(text, mode, null, id) == TextToSpeech.SUCCESS;
            if (!ok) abandonFocus();
        }
        r.put("spoken", ok);
        call.resolve(r);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (ready) tts.stop();
        abandonFocus();
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) tts.shutdown();
        abandonFocus();
    }
}
