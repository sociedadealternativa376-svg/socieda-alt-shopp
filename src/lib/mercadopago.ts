// Mercado Pago Public Key (publishable - safe for frontend)
export const MERCADOPAGO_PUBLIC_KEY = "TEST-1caa955b-34ff-4f63-8559-1412fd802501";

// SDK Script URL
const MERCADOPAGO_SDK_URL = "https://sdk.mercadopago.com/js/v2";

let mercadoPagoInstance: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

/**
 * Load the Mercado Pago SDK script dynamically
 */
export const loadMercadoPagoScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src="${MERCADOPAGO_SDK_URL}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = MERCADOPAGO_SDK_URL;
    script.async = true;
    
    script.onload = () => {
      console.log("✅ Mercado Pago SDK carregado com sucesso!");
      resolve();
    };
    
    script.onerror = () => {
      console.error("❌ Erro ao carregar Mercado Pago SDK");
      reject(new Error("Failed to load Mercado Pago SDK"));
    };

    document.head.appendChild(script);
  });
};

/**
 * Initialize Mercado Pago instance
 */
export const initMercadoPago = async (): Promise<any> => {
  // Return existing instance if available
  if (mercadoPagoInstance) {
    return mercadoPagoInstance;
  }

  // Return existing promise if loading
  if (loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  
  loadPromise = (async () => {
    try {
      await loadMercadoPagoScript();
      
      // @ts-ignore - MercadoPago is loaded globally
      if (typeof window.MercadoPago === "undefined") {
        throw new Error("MercadoPago not available on window");
      }

      // @ts-ignore
      mercadoPagoInstance = new window.MercadoPago(MERCADOPAGO_PUBLIC_KEY, {
        locale: "pt-BR",
      });

      console.log("✅ Mercado Pago inicializado com sucesso!");
      console.log("📦 Public Key:", MERCADOPAGO_PUBLIC_KEY.substring(0, 20) + "...");
      console.log("🔧 Métodos disponíveis: Pix, Cartão de Crédito");
      
      return mercadoPagoInstance;
    } catch (error) {
      console.error("❌ Erro ao inicializar Mercado Pago:", error);
      loadPromise = null;
      throw error;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
};

/**
 * Get the Mercado Pago instance (must be initialized first)
 */
export const getMercadoPago = (): any => {
  if (!mercadoPagoInstance) {
    console.warn("⚠️ Mercado Pago não foi inicializado. Chame initMercadoPago() primeiro.");
  }
  return mercadoPagoInstance;
};

/**
 * Check if SDK is loaded
 */
export const isMercadoPagoLoaded = (): boolean => {
  return mercadoPagoInstance !== null;
};
