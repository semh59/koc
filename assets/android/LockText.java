package com.neowell.app;

/** Lock-screen detail: with it off (the default) the alarm channels are the private twins (id + "p") and the title and text are generic. */
final class LockText {
    static final String TITLE = "NeoWell: hatırlatma", TEXT = "Açmak için dokun";

    private LockText() {}

    static String channel(String id, boolean detail) {
        return detail ? id : id + "p";
    }
}
