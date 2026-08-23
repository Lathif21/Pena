<script lang="ts">
  interface Props {
    label?: string
    id?: string
    type?: string
    value?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    class?: string
  }

  let {
    label,
    id,
    type = 'text',
    value = $bindable(''),
    placeholder,
    required = false,
    disabled = false,
    class: cls = ''
  }: Props = $props()
</script>

<div class={cls}>
  {#if label}
    <!-- Label selalu di atas field, tidak pernah di sampingnya. -->
    <label for={id} class="block text-sm font-medium text-foreground">{label}</label>
  {/if}
  <input
    {id}
    {type}
    {placeholder}
    {required}
    {disabled}
    bind:value
    class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none disabled:opacity-50"
  />
</div>
