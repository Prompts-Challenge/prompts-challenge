<script setup lang="ts">
import { isGithubLoggedIn, redirectToGithub, logout } from './auth/login';
import IdentityBoard from './components/IdentityBoard.vue';
import LoginButton from './components/LoginButton.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoggedIn = isGithubLoggedIn();
</script>

<template>
  <div class="w-screen h-screen flex flex-row">
    <div class="flex flex-grow-[1] h-full p-5">
      <div class="w-full h-full border-2 border-dashed p-0">
        <div class="m-0 border-b-2 border-dashed h-24 p-2">
          <IdentityBoard />
        </div>
        <button @click="logout()">Logout</button>
      </div>
    </div>
    <div class="flex flex-grow-[3] h-full">
      <div class="w-full h-full flex justify-center items-center" v-if="!isLoggedIn">
        <div class="w-full h-full flex justify-center items-center"
          v-if="router.currentRoute.value.path === '/auth/callback'">
          <router-view />
        </div>
        <div class="w-56 h-12" v-else>
          <LoginButton @click="redirectToGithub()" />
        </div>
      </div>
    </div>
  </div>
</template>
