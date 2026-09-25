import React, { useState } from 'react';
import { Calculator, Sparkles, TrendingUp, Check, ArrowRight, Layers } from 'lucide-react';

interface CalculatorProps {
  taxaComissaoPadrao?: number;
  compact?: boolean;
}

export const CommissionCalculator: React.FC<CalculatorProps> = ({
  taxaComissaoPadrao = 10,
  compact = false,
}) => {
  const [incluiIdentidade, setIncluiIdentidade] = useState(true);
  const [quantidadeItens, setQuantidadeItens] = useState(200);
  const [precoPorItem, setPrecoPorItem] = useState(65);
  const [vendasPorMes, setVendasPorMes] = useState<number>(10); // Opções: 1, 10, 25, 50, 100
  const [tipoItem, setTipoItem] = useState<'velas' | 'difusores' | 'aromatizadores'>('velas');

  const opcoesVendasMes = [1, 10, 25, 50, 100];

  const valorIdentidade = incluiIdentidade ? 2300 : 0;
  const valorItens = quantidadeItens * precoPorItem;
  const valorTotalProjeto = valorIdentidade + valorItens;
  const valorComissaoPorVenda = (valorTotalProjeto * taxaComissaoPadrao) / 100;

  // Ganhos totais mensais e anuais baseados no número de vendas por mês
  const comissaoTotalMensal = valorComissaoPorVenda * vendasPorMes;
  const comissaoTotalAnual = comissaoTotalMensal * 12;
  const faturamentoTotalMensal = valorTotalProjeto * vendasPorMes;

  const presets = [
    {
      nome: 'Corporativo & Identidade (200 Velas)',
      incluiId: true,
      qtd: 200,
      preco: 65,
      tipo: 'velas' as const,
    },
    {
      nome: 'Casamento & Evento Luxo (300 Difusores)',
      incluiId: true,
      qtd: 300,
      preco: 85,
      tipo: 'difusores' as const,
    },
    {
      nome: 'Brinde de Fim de Ano (500 Velas Médias)',
      incluiId: false,
      qtd: 500,
      preco: 45,
      tipo: 'velas' as const,
    },
    {
      nome: 'Boutique Hotel (100 Aromatizadores Premium)',
      incluiId: true,
      qtd: 100,
      preco: 120,
      tipo: 'aromatizadores' as const,
    }
  ];

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className={`bg-white rounded-2xl border border-[#E8DFD4] shadow-xs overflow-hidden ${compact ? 'p-5' : 'p-6 sm:p-8'}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#F0E7DD] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E8DFD4] flex items-center justify-center text-[#B86B43]">
              <Calculator className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#2C2724]">
              Simulador de Comissões Can Candles
            </h3>
          </div>
          <p className="text-xs text-[#7A7169] mt-1">
            Comissão de <strong>{taxaComissaoPadrao}% cravada</strong> sobre o valor integral de cada projeto fechado.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIncluiIdentidade(p.incluiId);
                setQuantidadeItens(p.qtd);
                setPrecoPorItem(p.preco);
                setTipoItem(p.tipo);
              }}
              className="text-[11px] px-2.5 py-1 rounded-md border border-[#E8DFD4] bg-[#FAF7F2] hover:bg-[#F3ECE2] text-[#4A423D] transition-colors cursor-pointer"
            >
              {p.nome.split(' ')[0]} {p.qtd} {p.tipo}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Controls & Real-time result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        
        {/* Sliders & Inputs (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Elemento Obrigatório: Quantidade de vendas por mês */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#FAF7F2] to-[#F5ECE1] border border-[#E3D7C9]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B86B43]">
                    Projeção de Escala
                  </span>
                  <span className="text-[10px] bg-[#B86B43]/10 text-[#B86B43] px-2 py-0.5 rounded-full font-bold">
                    Novo
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-[#2C2724] mt-0.5">
                  Quantidade de vendas por mês
                </h4>
                <p className="text-[11px] text-[#7A7169]">
                  Quantos projetos/clientes você estima indicar ou fechar mensalmente:
                </p>
              </div>

              <div className="inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-[#E3D7C9] shadow-2xs font-mono font-bold text-xs text-[#B86B43] self-start sm:self-auto">
                <Layers className="w-3.5 h-3.5" />
                <span>{vendasPorMes} {vendasPorMes === 1 ? 'venda' : 'vendas'}/mês</span>
              </div>
            </div>

            {/* Opções solicitadas: 1, 10, 25, 50, 100 */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1">
              {opcoesVendasMes.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setVendasPorMes(opt)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                    vendasPorMes === opt
                      ? 'bg-[#B86B43] text-white border-[#B86B43] shadow-xs'
                      : 'bg-white text-[#4A423D] border-[#E8DFD4] hover:bg-[#FAF7F2] hover:border-[#D9CFC4]'
                  }`}
                >
                  <span className="text-sm font-mono">{opt}</span>
                  <span className="text-[9px] uppercase tracking-tighter opacity-80">
                    {opt === 1 ? 'venda' : 'vendas'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantidade de Itens Materializados */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-[#2C2724]">
                Quantidade de Itens Materializados por Projeto
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={quantidadeItens}
                  onChange={(e) => setQuantidadeItens(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-right px-2 py-1 text-xs font-bold text-[#2C2724] border border-[#E3D7C9] rounded-md bg-[#FAF7F2]"
                />
                <span className="text-xs text-[#7A7169]">unid.</span>
              </div>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={quantidadeItens}
              onChange={(e) => setQuantidadeItens(parseInt(e.target.value))}
              className="w-full accent-[#B86B43] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#A69C93] mt-1 font-mono">
              <span>10 unid.</span>
              <span>200 (Corporativo padrão)</span>
              <span>500</span>
              <span>1.000 unid.</span>
            </div>
          </div>

          {/* Valor Médio por Item */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-[#2C2724]">
                Valor Médio por Item (Vela, Difusor ou Home Spray)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="20"
                  max="400"
                  value={precoPorItem}
                  onChange={(e) => setPrecoPorItem(Math.max(20, Math.min(400, parseInt(e.target.value) || 20)))}
                  className="w-20 text-right px-2 py-1 text-xs font-bold text-[#2C2724] border border-[#E3D7C9] rounded-md bg-[#FAF7F2]"
                />
                <span className="text-xs text-[#7A7169]">R$/unid.</span>
              </div>
            </div>
            <input
              type="range"
              min="20"
              max="400"
              step="5"
              value={precoPorItem}
              onChange={(e) => setPrecoPorItem(parseInt(e.target.value))}
              className="w-full accent-[#B86B43] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#A69C93] mt-1 font-mono">
              <span>R$ 20 (Mini velas)</span>
              <span>R$ 65 (Vela âmbar 140g)</span>
              <span>R$ 150 (Cerâmica/Difusor)</span>
              <span>R$ 400 (Design Luxo)</span>
            </div>
          </div>

          {/* Identidade Olfativa Switch */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EBE1D6] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#B86B43]">
                  Serviço Exclusivo
                </span>
                <span className="text-[10px] bg-[#E8DFD4] text-[#4A423D] px-2 py-0.5 rounded-full font-mono font-medium">
                  R$ 2.300,00
                </span>
              </div>
              <p className="font-medium text-sm text-[#2C2724] mt-0.5">
                Criação de Identidade Olfativa da Marca
              </p>
              <p className="text-xs text-[#7A7169]">
                Pirâmide olfativa sob medida, testes e formulação personalizada.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setIncluiIdentidade(!incluiIdentidade)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                incluiIdentidade ? 'bg-[#B86B43]' : 'bg-[#D6CDC2]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  incluiIdentidade ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>

        {/* Real-time Calculation Result Box (Col 5) */}
        <div className="lg:col-span-5 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD4] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD4]">
              <span className="text-[11px] uppercase tracking-widest text-[#B86B43] font-bold">
                Resultado da Simulação
              </span>
              <span className="text-[10px] text-[#4A423D] bg-white border border-[#E8DFD4] px-2 py-0.5 rounded-full font-medium">
                {vendasPorMes} {vendasPorMes === 1 ? 'venda/mês' : 'vendas/mês'}
              </span>
            </div>

            <div className="mt-4 space-y-2 pb-4 border-b border-[#E8DFD4] text-xs">
              <div className="flex justify-between text-[#7A7169]">
                <span>Ticket Médio por Projeto:</span>
                <span className="font-mono text-[#2C2724] font-semibold">
                  {formatBRL(valorTotalProjeto)}
                </span>
              </div>
              <div className="flex justify-between text-[#7A7169]">
                <span>Comissão por Venda ({taxaComissaoPadrao}%):</span>
                <span className="font-mono text-[#B86B43] font-semibold">
                  {formatBRL(valorComissaoPorVenda)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[#7A7169]">
                <span>Faturamento Total ({vendasPorMes}x):</span>
                <span className="font-mono text-[#2C2724]">
                  {formatBRL(faturamentoTotalMensal)}
                </span>
              </div>
            </div>

            {/* Big Highlight: Ganhos Mensais */}
            <div className="mt-5 p-4 rounded-xl bg-white border border-[#E3D7C9] text-center shadow-xs">
              <span className="text-[11px] uppercase tracking-wider text-[#7A7169] block mb-1">
                Sua Comissão Estimada por Mês
              </span>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#B86B43]">
                {formatBRL(comissaoTotalMensal)}
              </div>
              <span className="inline-block mt-2 text-[11px] text-[#5B6E58] bg-[#EEF3ED] px-2.5 py-0.5 rounded-full font-semibold">
                {vendasPorMes} {vendasPorMes === 1 ? 'venda fechada' : 'vendas fechadas'} a cada 30 dias
              </span>
            </div>

            {/* Projection Note */}
            <div className="mt-4 text-[11px] text-[#7A7169] space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/70 border border-[#EBE1D6]">
                <span className="font-medium text-[#2C2724]">Projeção Anual (12 meses):</span>
                <span className="font-mono font-bold text-[#2C2724]">{formatBRL(comissaoTotalAnual)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#5B6E58]">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Sem teto de ganhos: quanto mais você indica, mais você ganha.</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E8DFD4] text-[10px] text-[#8C827A] flex items-center justify-between">
            <span>*Valores ilustrativos baseados no portfólio oficial Can Candles.</span>
          </div>

        </div>

      </div>

    </div>
  );
};
