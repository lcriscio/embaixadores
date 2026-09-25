export function downloadDistZip() {
  const link = document.createElement('a');
  link.href = './dist.zip';
  link.download = 'dist.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
