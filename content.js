// Store processed images to avoid duplicate processing
const processedImages = new WeakSet();

// Show notification message
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'codmon-notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  // Remove notification after animation ends
  notification.addEventListener('animationend', () => {
    document.body.removeChild(notification);
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadStarted') {
    showNotification(`Downloading: ${request.filename}`);
  }
});

function addDownloadButton(imgElement) {
  // Skip if image is already processed
  if (processedImages.has(imgElement)) {
    return;
  }

  // Check if image is from image.codmon.com
  if (!imgElement.src.includes('image.codmon.com')) {
    return;
  }

  // Mark image as processed
  processedImages.add(imgElement);

  // Set styles for parent of imgElement as reference point for download button
  imgElement.parentNode.style.position = 'relative';

  // Create download button
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'codmon-download-btn';
  downloadBtn.textContent = 'Download';

  downloadBtn.addEventListener('click', function(event) {
    // Prevent event bubbling to parent elements
    event.stopPropagation();

    const originalUrl = new URL(imgElement.src);
    originalUrl.searchParams.set('width', '1800');
    const downloadUrl = originalUrl.toString();
    const fileName = downloadUrl.split('/').pop().split('?')[0];

    chrome.runtime.sendMessage({
      action: 'downloadImage',
      url: downloadUrl,
      filename: fileName
    });
  });

  // Insert download button after the image
  imgElement.insertAdjacentElement('afterend', downloadBtn);
}

// Use debounce to prevent excessive processing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Process images with debounce
const processImages = debounce(() => {
  const images = document.getElementsByTagName('img');
  for (let img of images) {
    addDownloadButton(img);
  }
}, 100);

// Optimized observer
const observer = new MutationObserver((mutations) => {
  let shouldProcess = false;

  for (const mutation of mutations) {
    // Quick check for new nodes
    if (mutation.addedNodes.length > 0) {
      shouldProcess = true;
      break;
    }
  }

  if (shouldProcess) {
    processImages();
  }
});

// Initialize observer with appropriate options
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false
});

// Process images when page loads
window.addEventListener('load', processImages);
processImages();
