<template>
	<k-field v-bind="$props" :input="_uid" :help="preview" class="k-slug-field">
		<template v-if="wizard && wizard.text" #options>
			<k-button
				:text="wizard.text"
				icon="sparkling"
				size="xs"
				variant="filled"
				@click="onWizard"
			/>
		</template>

		<k-input
			v-bind="$props"
			:id="_uid"
			ref="input"
			:value="slug"
			theme="field"
			type="slug"
			v-on="$listeners"
		/>
	</k-field>
</template>

<script>
import { props as Field } from "../Field.vue";
import { props as Input } from "../Input.vue";
import { props as SlugInput } from "../Input/SlugInput.vue";

/**
 * @example <k-slug-field :value="slug" @input="slug = $event" name="slug" label="Slug" />
 */
export default {
	mixins: [Field, Input, SlugInput],
	inheritAttrs: false,
	props: {
		icon: {
			type: String,
			default: "url"
		},
		path: {
			type: String
		},
		wizard: {
			type: [Boolean, Object],
			default: false
		}
	},
	data() {
		return {
			slug: this.value
		};
	},
	computed: {
		preview() {
			if (this.help !== undefined) {
				return this.help;
			}

			if (this.path !== undefined) {
				return this.path + this.value;
			}

			return null;
		}
	},
	watch: {
		value() {
			this.slug = this.value;
		}
	},
	methods: {
		focus() {
			this.$refs.input.focus();
		},
		onWizard() {
			let field = this.wizard?.field;

			if (field) {
				const value = this.formData[field.toLowerCase()];

				if (value) {
					this.slug = value;
				}
			}
		}
	}
};
</script>
