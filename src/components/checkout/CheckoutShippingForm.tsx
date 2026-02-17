interface CustomerData {
  email: string;
  name: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CheckoutShippingFormProps {
  customerData: CustomerData;
  setCustomerData: React.Dispatch<React.SetStateAction<CustomerData>>;
  fetchAddressByCep: (cep: string) => void;
  formatCep: (value: string) => string;
  loadingCep: boolean;
}

export const CheckoutShippingForm = ({
  customerData,
  setCustomerData,
  fetchAddressByCep,
  formatCep,
  loadingCep,
}: CheckoutShippingFormProps) => {
  const inputClass =
    'w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition-all';

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-700/80 p-6 mb-6 shadow-xl">
      <h2 className="font-semibold text-lg mb-5 text-white">Dados de Entrega</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-300">Email</label>
          <input
            type="email"
            value={customerData.email}
            onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
            placeholder="seu@email.com"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-300">Nome Completo</label>
            <input
              type="text"
              value={customerData.name}
              onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
              placeholder="Seu nome"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-300">Telefone</label>
            <input
              type="tel"
              value={customerData.phone}
              onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className={inputClass}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-700">
          <p className="text-sm font-medium text-zinc-300 mb-3">Endereço de entrega</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium mb-2 text-zinc-300">CEP</label>
              <input
                type="text"
                value={customerData.cep}
                onChange={(e) => setCustomerData({ ...customerData, cep: formatCep(e.target.value) })}
                onBlur={() => fetchAddressByCep(customerData.cep)}
                placeholder="00000-000"
                maxLength={9}
                className={inputClass}
              />
              {loadingCep && <p className="text-xs text-sky-400 mt-1">Buscando...</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2 text-zinc-300">Rua</label>
              <input
                type="text"
                value={customerData.street}
                onChange={(e) => setCustomerData({ ...customerData, street: e.target.value })}
                placeholder="Nome da rua"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Número</label>
              <input
                type="text"
                value={customerData.number}
                onChange={(e) => setCustomerData({ ...customerData, number: e.target.value })}
                placeholder="123"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Complemento</label>
              <input
                type="text"
                value={customerData.complement}
                onChange={(e) => setCustomerData({ ...customerData, complement: e.target.value })}
                placeholder="Apto, bloco..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Bairro</label>
              <input
                type="text"
                value={customerData.neighborhood}
                onChange={(e) => setCustomerData({ ...customerData, neighborhood: e.target.value })}
                placeholder="Bairro"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Cidade</label>
              <input
                type="text"
                value={customerData.city}
                onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                placeholder="Cidade"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Estado</label>
              <input
                type="text"
                value={customerData.state}
                onChange={(e) =>
                  setCustomerData({ ...customerData, state: e.target.value.toUpperCase().slice(0, 2) })
                }
                placeholder="SP"
                maxLength={2}
                className={`${inputClass} uppercase`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
