<script setup lang="ts">
import { ref, shallowRef, watch, computed, onMounted, onUnmounted } from 'vue'
import * as vue from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { mdiApps } from '@mdi/js'


const drawer = ref()


</script>

<template><v-layout class="rounded rounded-md">
        <v-app-bar
            title="笔记转Anki"
            color="grey-lighten-3"
            density="compact"
        >
            <template v-slot:prepend>
                <v-app-bar-nav-icon
                    :icon="mdiApps"
                    @click.stop="drawer = !drawer"
                />
            </template>
        </v-app-bar>

        <v-navigation-drawer v-model="drawer">
            <v-list>
                <v-list-item
                    title="幕布OPML"
                    link
                    to="/mubuopml"
                />
            </v-list>
        </v-navigation-drawer>


        <v-main
            class="d-flex align-center justify-center"
            style="min-height: 300px;"
        >
            <v-container>
                <router-view />
            </v-container>
        </v-main>
    </v-layout></template>