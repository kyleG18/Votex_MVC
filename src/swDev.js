export default function swDev() {
  // In Vite, we usually just use the absolute path from public
  const swUrl = `/sw.js`;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register(swUrl)
      .then((response) => {
        console.warn("Service Worker Registered");
      })
      .catch((error) => {
        console.warn("Service Worker Registration Failed", error);
      });
  }
}
