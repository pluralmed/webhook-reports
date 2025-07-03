// api/index.js - Função serverless para Vercel
const axios = require('axios');

// Configurações do Power BI (usar variáveis de ambiente em produção)
const CONFIG = {
  tokenUrl: 'https://login.microsoftonline.com/af3418b2-1c45-4617-bdf0-c3c236a9d9ab/oauth2/v2.0/token',
  dataUrl: 'https://api.powerbi.com/v1.0/myorg/groups/ee1b786e-b489-4c88-b1df-a5458d24b068/datasets/96439acf-643b-4049-8668-43463263a0d8/executeQueries',
  clientId: process.env.POWERBI_CLIENT_ID || 'a4084597-9a9b-466d-84fc-ef6d2dfc5076',
  clientSecret: process.env.POWERBI_CLIENT_SECRET || 'H2-8Q~07ALkqjvH5F.S84ogf8OMkw.K1_wdBxdor',
  scope: 'https://analysis.windows.net/powerbi/api/.default'
};

// Função para obter token
async function getToken() {
  try {
    const response = await axios.post(CONFIG.tokenUrl, 
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CONFIG.clientId,
        client_secret: CONFIG.clientSecret,
        scope: CONFIG.scope
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Erro ao obter token:', error.response?.data || error.message);
    throw new Error('Erro ao obter token: ' + error.message);
  }
}

// Função para buscar dados
async function getData(token, customQuery = null) {
  try {
    const query = customQuery || "EVALUATE SELECTCOLUMNS(f_reports, f_reports[data], f_reports[nome_colaborador], f_reports[setor], f_reports[atividades])";
    
    const response = await axios.post(CONFIG.dataUrl, {
      queries: [{ query }],
      serializerSettings: {
        includeNulls: true
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados:', error.response?.data || error.message);
    throw new Error('Erro ao buscar dados: ' + error.message);
  }
}

// Função para processar perguntas
function processQuestion(data, question) {
  if (!data.results || !data.results[0] || !data.results[0].tables) {
    return "Nenhum dado encontrado";
  }
  
  const table = data.results[0].tables[0];
  const rows = table.rows;
  
  // Análises básicas baseadas na pergunta
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('total') || questionLower.includes('quantidade')) {
    return {
      totalRegistros: rows.length,
      message: `Total de ${rows.length} registros encontrados`
    };
  }
  
  if (questionLower.includes('setor')) {
    const setores = {};
    rows.forEach(row => {
      const setor = row[2]; // setor é a terceira coluna
      if (setor) {
        setores[setor] = (setores[setor] || 0) + 1;
      }
    });
    return {
      setores,
      message: 'Distribuição por setor',
      totalSetores: Object.keys(setores).length
    };
  }
  
  if (questionLower.includes('colaborador')) {
    const colaboradores = {};
    rows.forEach(row => {
      const colaborador = row[1]; // nome_colaborador é a segunda coluna
      if (colaborador) {
        colaboradores[colaborador] = (colaboradores[colaborador] || 0) + 1;
      }
    });
    return {
      colaboradores,
      message: 'Distribuição por colaborador',
      totalColaboradores: Object.keys(colaboradores).length
    };
  }
  
  if (questionLower.includes('atividade')) {
    const atividades = {};
    rows.forEach(row => {
      const atividade = row[3]; // atividades é a quarta coluna
      if (atividade) {
        atividades[atividade] = (atividades[atividade] || 0) + 1;
      }
    });
    return {
      atividades,
      message: 'Distribuição por atividades',
      totalAtividades: Object.keys(atividades).length
    };
  }
  
  // Retorna dados básicos se não encontrar padrão específico
  return {
    amostra: rows.slice(0, 5), // Primeiros 5 registros
    total: rows.length,
    colunas: table.columns.map(col => col.name),
    message: 'Dados do relatório'
  };
}

// Função principal da API
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Endpoint de teste
    if (req.method === 'GET' && req.url === '/api/test') {
      res.json({ 
        message: 'Webhook funcionando!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
      return;
    }
    
    // Endpoint principal
    if (req.method === 'POST') {
      const { question, customQuery } = req.body;
      
      if (!question && !customQuery) {
        res.status(400).json({
          success: false,
          error: 'Pergunta ou query personalizada é obrigatória'
        });
        return;
      }
      
      // Obter token
      console.log('Obtendo token...');
      const token = await getToken();
      
      // Buscar dados
      console.log('Buscando dados...');
      const data = await getData(token, customQuery);
      
      // Processar dados baseado na pergunta
      console.log('Processando dados...');
      const processedData = processQuestion(data, question || 'dados gerais');
      
      res.json({
        success: true,
        data: processedData,
        timestamp: new Date().toISOString(),
        // rawData: data // Descomente se quiser ver os dados brutos
      });
      
    } else {
      res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
    }
    
  } catch (error) {
    console.error('Erro na API:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};