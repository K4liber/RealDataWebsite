<template>
	<div class="content">
		<LeafletMap/>
		<Menu/>
	</div>
</template>
<script>

import LeafletMap from './LeafletMap'
import Menu from './Menu'

export default {
    name: 'Main',
	components: {
		LeafletMap,
		Menu
  	}
}
</script>

<style scoped>

.content
{
	height: 100vh;
	padding: 0;
    margin: 0;
}

</style>
