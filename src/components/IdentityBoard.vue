<script setup lang="ts">
import { getCurrentUser, isGithubLoggedIn } from '../auth/login';
import { ref } from 'vue';

const isLoggedIn = isGithubLoggedIn();

const avatarUrl = ref<string | null>(null);
const name = ref<string | null>(null);
const id = ref<string | null>(null);

if (isLoggedIn) {
  const user = getCurrentUser()
  avatarUrl.value = user?.avatar_url!;
  name.value = user?.name!;
  id.value = user?.name!;
}
</script>

<template>
  <div class="w-full h-full flex flex-row">
    <div class="flex h-full aspect-square border-2 border-dashed">
      <img :src="avatarUrl!" alt="test" class="w-full h-full object-cover" v-if="isLoggedIn">
    </div>
    <div class="flex h-full w-full flex-col p-1">
      <div class="flex flex-grow-[5] border-2 border-dashed w-full">
        <span class="font-mono text-sm" v-if="isLoggedIn">{{ name }}</span>
      </div>
      <div class="flex flex-grow-[3] border-2 border-dashed w-full">
        <span class="font-mono text-sm" v-if="isLoggedIn">{{ id }}</span>
      </div>
    </div>
  </div>
</template>
