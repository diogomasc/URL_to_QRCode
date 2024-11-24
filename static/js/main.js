function showToast(title, message, type = "success") {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toastify ${type}`;
  
  toast.innerHTML = `
    <div class="toastify-content">
      <span class="toastify-icon">${type === "success" ? "✓" : "✕"}</span>
      <div class="toastify-text">
        <div><strong>${title}</strong></div>
        <div>${message}</div>
      </div>
      <div class="toastify-progress"></div>
    </div>
  `;

  // Add to document
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.style.opacity = '1', 10);

  // Remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => document.body.removeChild(toast), 400);
  }, 3000);
}

async function generateQRCode() {
  const urlInput = document.getElementById("urlInput");
  const url = urlInput.value.trim();

  if (!url) {
    showToast("Erro", "Por favor, insira uma URL válida", "error");
    return;
  }

  // Validação básica de URL no frontend
  try {
    new URL(url);
  } catch (e) {
    showToast(
      "Erro",
      "URL inválida. Certifique-se de incluir http:// ou https://",
      "error"
    );
    return;
  }

  const loader = document.getElementById("loader");
  const qrResult = document.getElementById("qrResult");
  const qrImage = document.getElementById("qrImage");

  // Remove hidden class and add visible class for smooth transition
  qrResult.classList.remove("visible");
  loader.classList.remove("hidden");
  loader.classList.add("visible");

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (data.success) {
      // Pre-load the image before showing
      const img = new Image();
      img.src = `data:image/png;base64,${data.image}`;
      
      img.onload = () => {
        qrImage.src = img.src;
        qrImage.dataset.filename = data.filename;
        loader.classList.remove("visible");
        loader.classList.add("hidden");
        qrResult.classList.add("visible");
        showToast("Sucesso", "Seu QR Code foi gerado!", "success");
      };
    } else {
      showToast("Erro", data.error || "QR Code não pode ser gerado", "error");
      loader.classList.remove("visible");
      loader.classList.add("hidden");
    }
  } catch (error) {
    showToast(
      "Erro",
      "Erro interno do servidor. Por favor, tente novamente mais tarde.",
      "error"
    );
    loader.classList.remove("visible");
    loader.classList.add("hidden");
  }
}

async function downloadQR() {
  const qrImage = document.getElementById("qrImage");
  const link = document.createElement("a");
  link.href = qrImage.src;
  link.download = qrImage.dataset.filename || "qrcode.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Sucesso", "QR Code baixado com sucesso!", "success");
}

async function copyQR() {
  const qrImage = document.getElementById("qrImage");
  try {
    const response = await fetch(qrImage.src);
    const blob = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
    showToast(
      "Sucesso",
      "QR Code copiado para a área de transferência!",
      "success"
    );
  } catch (err) {
    showToast("Erro", "Não foi possível copiar o QR Code", "error");
  }
}

// Adicionar validação ao pressionar Enter
document.addEventListener("DOMContentLoaded", function() {
  document
    .getElementById("urlInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        generateQRCode();
      }
    });
});
