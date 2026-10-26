let installPrompt=null;
const installButton=document.createElement('button');installButton.className='pwa-install';installButton.innerHTML='⇩ Instalar';document.body.appendChild(installButton);
const iosHelp=document.createElement('div');iosHelp.className='pwa-ios-help';iosHelp.innerHTML='<button aria-label="Cerrar">×</button><strong>Instalar en iPhone</strong><br>Abre esta página en Safari, toca Compartir y elige <b>Agregar a pantalla de inicio</b>.';document.body.appendChild(iosHelp);iosHelp.querySelector('button').onclick=()=>iosHelp.classList.remove('show');
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;installButton.classList.add('show');});
installButton.onclick=async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;installButton.classList.remove('show');return;}iosHelp.classList.add('show');};
const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent),standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone;
if(isiOS&&!standalone)installButton.remove();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
