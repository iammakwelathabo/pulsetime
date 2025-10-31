// Import Vue
import { createApp } from 'vue';


// Import Framework7
import Framework7 from 'framework7/lite-bundle';

// Import Framework7-Vue Plugin
import Framework7Vue, { registerComponents } from 'framework7-vue/bundle';

// Import Framework7 Styles
import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.css';

// Import App Component
import App from '../components/app.vue';

// Init Framework7-Vue Plugin
Framework7.use(Framework7Vue);

// Init App
const app = createApp(App);

// Register Framework7 Vue components
registerComponents(app);

// Mount the app
app.mount('#app');

// Dynamically injecting cordova.js
// F7/webpack somehow removes cordova.js during runtime, the code below prevents this behavior
if (window.cordova === undefined) {
    const script = document.createElement('script');
    script.src = 'cordova.js';
    document.head.appendChild(script);
}