package com.linmoblog.server.utils;

public final class PublicResourceUrl {
    private static final String ROOT_SEPARATOR = "/";

    private PublicResourceUrl() {
    }

    public static String normalize(String value) {
        if (value == null || value.isBlank() || isExternal(value) || value.startsWith(ROOT_SEPARATOR)) {
            return value;
        }
        return ROOT_SEPARATOR + value;
    }

    private static boolean isExternal(String value) {
        return value.startsWith("http://")
                || value.startsWith("https://")
                || value.startsWith("//")
                || value.startsWith("data:")
                || value.startsWith("blob:");
    }
}
