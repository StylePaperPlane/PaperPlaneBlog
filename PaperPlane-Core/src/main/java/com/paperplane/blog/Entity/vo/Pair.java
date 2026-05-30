package com.paperplane.blog.Entity.vo;

import lombok.Data;

@Data
public class Pair<K,V> {
    private K pairKey;
    private V pairValue;

    public Pair() {
    }

    public Pair(K pairKey, V pairValue) {
        this.pairKey = pairKey;
        this.pairValue = pairValue;
    }



}
