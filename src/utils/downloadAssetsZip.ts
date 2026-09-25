export function downloadAssetsZip() {
  const link = document.createElement('a');
  link.href = './assets.zip';
  link.download = 'assets.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
