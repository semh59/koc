package com.neowell.app;

import java.util.TimeZone;

/** Keeps the wall-clock slot of a saved alarm when the phone moves to another time zone: 08:00 stays 08:00 there. */
final class ZoneMath {
    private ZoneMath() {}

    static long move(long at, TimeZone from, TimeZone to) {
        return at + from.getOffset(at) - to.getOffset(at);
    }

    /** Past entries (0 or unset) are left alone. */
    static long[] move(long[] times, TimeZone from, TimeZone to) {
        long[] out = times.clone();
        for (int k = 0; k < out.length; k++) if (out[k] > 0) out[k] = move(out[k], from, to);
        return out;
    }
}
