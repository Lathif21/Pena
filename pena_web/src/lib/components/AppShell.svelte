<script lang="ts">
  import type { Component, Snippet } from 'svelte'
  import { page } from '$app/state'
  import { Menu, X, LogOut } from 'lucide-svelte'

  interface NavItem {
    href: string
    label: string
    icon: Component
  }

  interface Props {
    nav: NavItem[]
    nama: string
    peran: string
    children: Snippet
  }

  let { nav, nama, peran, children }: Props = $props()

  let drawerBuka = $state(false)

  // Prefix, bukan sama persis — supaya sub-route seperti /tentor/nilai/input
  // tetap menyalakan item "Input Nilai".
  const aktif = (href: string) =>
    page.url.pathname === href || page.url.pathname.startsWith(href + '/')

  const inisial = $derived(
    nama
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase()
  )

  // Drawer menutup sendiri saat pindah halaman; tanpa ini ia menutupi
  // halaman baru di HP.
  $effect(() => {
    page.url.pathname
    drawerBuka = false
  })
</script>

<div class="min-h-screen bg-background">
  <!-- Top bar hanya di bawah lg. Sticky supaya hamburger selalu terjangkau. -->
  <header
    class="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden"
  >
    <button
      onclick={() => (drawerBuka = true)}
      aria-label="Buka menu"
      class="rounded-lg p-2.5 hover:bg-muted/40"
    >
      <Menu class="h-5 w-5" />
    </button>
    <span class="font-serif text-lg text-foreground">Pena</span>
  </header>

  {#if drawerBuka}
    <button
      class="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
      aria-label="Tutup menu"
      onclick={() => (drawerBuka = false)}
    ></button>
  {/if}

  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:translate-x-0 {drawerBuka
      ? 'translate-x-0'
      : '-translate-x-full'}"
  >
    <div class="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
      <span class="font-serif text-xl">Pena</span>
      <button
        onclick={() => (drawerBuka = false)}
        aria-label="Tutup menu"
        class="rounded-lg p-2.5 hover:bg-sidebar-accent lg:hidden"
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <nav class="flex-1 space-y-1 overflow-y-auto p-3">
      {#each nav as item (item.href)}
        {@const ini = aktif(item.href)}
        <a
          href={item.href}
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm {ini
            ? 'border-r-2 border-accent bg-sidebar-accent font-semibold'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60'}"
        >
          <item.icon class="h-4 w-4 shrink-0" />
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="border-t border-sidebar-border p-3">
      <div class="flex items-center gap-3 px-1 py-2">
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold"
        >
          {inisial}
        </span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-medium">{nama}</span>
          <span class="block truncate text-xs text-sidebar-foreground/70">{peran}</span>
        </span>
      </div>
      <!-- Sidebar tampil di semua halaman, jadi logout tidak bisa memakai
           action milik satu halaman. Endpoint bersama di /auth/logout. -->
      <form method="POST" action="/auth/logout">
        <button
          type="submit"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
        >
          <LogOut class="h-4 w-4 shrink-0" />
          Keluar
        </button>
      </form>
    </div>
  </aside>

  <div class="lg:pl-60">
    <main class="mx-auto max-w-[1200px] p-4 lg:p-8">
      {@render children()}
    </main>
  </div>
</div>
