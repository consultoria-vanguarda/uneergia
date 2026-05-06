/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Analise from './pages/Analise';
import AnaliseUsinas from './pages/AnaliseUsinas';
import Atividades from './pages/Atividades';
import Automacao from './pages/Automacao';
import CadastroLead from './pages/CadastroLead';
import Clientes from './pages/Clientes';
import Contatos from './pages/Contatos';
import Contratos from './pages/Contratos';
import Dashboard from './pages/Dashboard';
import DocuSignConfig from './pages/DocuSignConfig';
import DocuSignEnvelopes from './pages/DocuSignEnvelopes';
import DocuSignEnvio from './pages/DocuSignEnvio';
import Documentacao from './pages/Documentacao';
import Financeiro from './pages/Financeiro';
import GestaoUsuarios from './pages/GestaoUsuarios';
import IntegracaoDynamics from './pages/IntegracaoDynamics';
import Leads from './pages/Leads';
import Oportunidades from './pages/Oportunidades';
import Propostas from './pages/Propostas';
import Relatorios from './pages/Relatorios';
import UnidadesConsumidoras from './pages/UnidadesConsumidoras';
import Usinas from './pages/Usinas';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Analise": Analise,
    "AnaliseUsinas": AnaliseUsinas,
    "Atividades": Atividades,
    "Automacao": Automacao,
    "CadastroLead": CadastroLead,
    "Clientes": Clientes,
    "Contatos": Contatos,
    "Contratos": Contratos,
    "Dashboard": Dashboard,
    "DocuSignConfig": DocuSignConfig,
    "DocuSignEnvelopes": DocuSignEnvelopes,
    "DocuSignEnvio": DocuSignEnvio,
    "Documentacao": Documentacao,
    "Financeiro": Financeiro,
    "GestaoUsuarios": GestaoUsuarios,
    "IntegracaoDynamics": IntegracaoDynamics,
    "Leads": Leads,
    "Oportunidades": Oportunidades,
    "Propostas": Propostas,
    "Relatorios": Relatorios,
    "UnidadesConsumidoras": UnidadesConsumidoras,
    "Usinas": Usinas,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};