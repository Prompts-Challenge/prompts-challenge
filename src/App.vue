<template>
  <div class="w-screen h-screen flex flex-col lg:flex-row">
    <!-- 移动端顶部导航栏 -->
    <div class="lg:hidden flex items-center justify-between p-2 border-b-2 border-dashed">
      <button 
        @click="showMobileMenu = true"
        class="p-2 hover:bg-[#e5e7eb]">
        <div class="w-6 h-0.5 bg-gray-600 mb-1"></div>
        <div class="w-6 h-0.5 bg-gray-600 mb-1"></div>
        <div class="w-6 h-0.5 bg-gray-600"></div>
      </button>
      <div class="text-lg font-medium">Prompts Challenge</div>
      <div class="w-10"></div> <!-- 占位，保持居中 -->
    </div>

    <!-- 移动端侧边菜单 -->
    <div v-if="showMobileMenu" 
         class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
         @click="showMobileMenu = false">
      <div class="w-64 h-full bg-white" @click.stop>
        <div class="border-b-2 border-dashed h-24 p-2">
          <Suspense>
            <IdentityBoard />
          </Suspense>
        </div>
        <div class="flex flex-col">
          <div
            v-for="item in sidebar"
            :key="item.name"
            class="flex items-center h-12 px-4 hover:bg-[#e5e7eb]"
            :class="{ 'bg-[#e5e7eb]': router.currentRoute.value.path === item.path }"
            @click="handleItemClick(item)">
            <i :class="`fas fa-${item.icon} w-6`"></i>
            <router-link 
              :to="item.path" 
              v-if="item.path" 
              class="ml-2 flex-1">
              {{ item.name }}
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 桌面端侧边栏 -->
    <div class="hidden lg:flex w-1/4 h-full p-5">
      <div class="flex flex-col w-full h-full border-2 border-dashed p-0">
        <div class="m-0 border-b-2 border-dashed h-24 p-2">
          <Suspense>
            <IdentityBoard />
          </Suspense>
        </div>
        <div class="w-full h-full m-0 flex p-2">
          <div class="m-0 flex flex-col w-full h-full border-2 border-dashed p-0">
            <div
              v-for="item in sidebar"
              :key="item.name"
              class="m-0 flex flex-col w-full h-8 border-b-2 border-dashed select-none items-center hover:bg-[#e5e7eb]"
              :class="{ 'bg-[#e5e7eb]': router.currentRoute.value.path === item.path }"
              @click="handleItemClick(item)">
              <router-link 
                :to="item.path" 
                v-if="item.path" 
                class="font-mono text-sm flex m-2 ml-8 w-full h-full">
                {{ item.name }}
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="flex-1 h-[calc(100vh-48px)] lg:h-full">
      <div class="w-full h-full" v-if="!isLoggedIn">
        <div class="w-full h-full flex justify-center items-center"
          v-if="router.currentRoute.value.path === '/auth/callback'">
          <router-view />
        </div>
        <div class="w-full h-full flex justify-center items-center" v-else>
          <div class="w-56 h-12">
            <LoginButton @click="redirectToGithub()" />
          </div>
        </div>
      </div>
      <div class="w-full h-full flex justify-center items-center p-2 lg:p-5 lg:pl-0" v-else>
        <div class="w-full h-full border-2 border-dashed">
          <div class="w-full h-full overflow-auto">
            <router-view />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { isGithubLoggedIn, redirectToGithub, logout } from './auth/login';
import IdentityBoard from './components/IdentityBoard.vue';
import LoginButton from './components/LoginButton.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoggedIn = isGithubLoggedIn();
const showMobileMenu = ref(false);

const sidebar = ref([
  {
    name: '首页',
    icon: 'home',
    path: '/',
    children: []
  },
  {
    name: '竞赛',
    icon: 'trophy',
    path: '/competitions',
    children: []
  },
  {
    name: '排行榜',
    icon: 'chart-bar',
    path: '/leaderboard',
    children: []
  },
  {
    name: 'Prompt库',
    icon: 'database',
    path: '/prompts',
    children: []
  },
  {
    name: '个人中心',
    icon: 'user',
    path: '/profile',
    children: []
  },
  {
    name: '退出',
    icon: 'sign-out-alt',
    path: '/logout',
    click: logout,
    children: []
  }
]);

function handleItemClick(item: any) {
  if (item.click) {
    item.click();
  }
  showMobileMenu.value = false;
}
</script>

<style>
/* 防止移动端菜单出现时页面滚动 */
:root {
  &:has(.fixed) {
    overflow: hidden;
  }
}
</style>