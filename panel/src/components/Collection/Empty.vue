<template>
	<k-box v-bind="attrs" class="k-empty" @click.native="$emit('click', $event)">
		<slot>
			{{ text }}
		</slot>
	</k-box>
</template>

<script>
import { layout } from "@/mixins/props.js";

/**
 * Whenever you have to deal with an "empty" state, such as an empty list or a search without results, you can use the `k-empty` component to make it a bit nicer.
 *
 * @example <k-empty icon="image">No images yet</k-empty>
 */
export default {
	mixins: [layout],
	props: {
		/**
		 * Text to show inside the box
		 */
		text: String,
		/**
		 * Icon to show inside the box
		 */
		icon: String
	},
	computed: {
		attrs() {
			const attrs = {
				button: this.$listeners["click"] !== undefined,
				icon: this.icon,
				theme: "empty"
			};

			if (this.layout === "cardlets" || this.layout === "cards") {
				attrs.align = "center";
				attrs.height = "var(--item-height-cardlet)";
			}

			return attrs;
		}
	}
};
</script>

<style>
.k-empty {
	max-width: 100%;
}
</style>
