import { useEffect, useState } from 'react';
import {
  Asset,
  ChecklistTemplate,
  PreventivePlan,
  Technician,
  Ticket,
  TicketStatus,
  User,
  UserRole,
} from './types';
import {
  INITIAL_ASSETS,
  INITIAL_CHECKLIST_TEMPLATES,
  INITIAL_PREVENTIVE_PLANS,
  INITIAL_TECHNICIANS,
  INITIAL_TICKETS,
  INITIAL_USERS,
} from './data/initialData';
import {
  getPendingSyncQueue,
  isNetworkOnline,
  queueOfflineAction,
  syncPendingQueueWithBackend,
} from './utils/offlineSync';

// Navigation & Layout
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Views
import DashboardView from './components/DashboardView';
import TicketsView from './components/TicketsView';
import ScheduleView from './components/ScheduleView';
import TeamMapView from './components/TeamMapView';
import AssetsView from './components/AssetsView';
import PreventivesView from './components/PreventivesView';
import ChecklistsView from './components/ChecklistsView';
import TechnicianMobileApp from './components/TechnicianMobileApp';
import ManuAiAssistant from './components/ManuAiAssistant';
import FinancialView from './components/FinancialView';
import ReportsBiView from './components/ReportsBiView';
import SapIntegrationView from './components/SapIntegrationView';
import AnnualScheduleView from './components/AnnualScheduleView';
import MonthlyScheduleView from './components/MonthlyScheduleView';
import AnnualHeatmapView from './components/AnnualHeatmapView';
import PmocEquipmentsView from './components/PmocEquipmentsView';
import SapReconciliationView from './components/SapReconciliationView';
import ImportBaseView from './components/ImportBaseView';

// Real PCM Base Data (12 Sheets)
import MFV_BASE_DATA from './data/MFV_dados_base_google_ai_studio.json';
import { PcmDatabase } from './types/pcmTypes';

// Modals
import NewTicketModal from './components/NewTicketModal';
import TicketDetailModal from './components/TicketDetailModal';
import TechnicianDispatchModal from './components/TechnicianDispatchModal';
import QrCodeScannerModal from './components/QrCodeScannerModal';
import TechnicalReportModal from './components/TechnicalReportModal';
import GuidedDemoFlow from './components/GuidedDemoFlow';

export default function App() {
  // Users & Active User Profile (RBAC)
  const [users] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[1]); // Default: Ana Cláudia (PCM)
  const userRole: UserRole = currentUser.role;

  // Navigation state (Aligns with Sidebar IDs)
  const [currentTab, setCurrentTab] = useState<string>('DASHBOARD');

  // Core Business Entities
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [technicians, setTechnicians] = useState<Technician[]>(INITIAL_TECHNICIANS);
  const [preventivePlans, setPreventivePlans] = useState<PreventivePlan[]>(INITIAL_PREVENTIVE_PLANS);
  const [checklistTemplates] = useState<ChecklistTemplate[]>(INITIAL_CHECKLIST_TEMPLATES);

  // Real PCM Database (12 Sheets from MFV_dados_base_google_ai_studio.json)
  const [pcmDb, setPcmDb] = useState<PcmDatabase>(MFV_BASE_DATA as unknown as PcmDatabase);
  const [modoOperacao, setModoOperacao] = useState<'PRODUCAO' | 'DEMO'>('PRODUCAO');

  // Online / Offline & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);

  // Active Modals State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [dispatchTicket, setDispatchTicket] = useState<Ticket | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState<boolean>(false);
  const [preselectedAsset, setPreselectedAsset] = useState<Asset | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);
  const [reportTicket, setReportTicket] = useState<Ticket | null>(null);
  const [isDemoFlowOpen, setIsDemoFlowOpen] = useState<boolean>(false);

  // Fetch initial data from server on boot
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const json = await res.json();
          if (json.tickets && json.tickets.length > 0) setTickets(json.tickets);
          if (json.assets && json.assets.length > 0) setAssets(json.assets);
          if (json.technicians && json.technicians.length > 0) setTechnicians(json.technicians);
          if (json.preventivePlans && json.preventivePlans.length > 0) setPreventivePlans(json.preventivePlans);
          if (json.pcmDatabase) setPcmDb(json.pcmDatabase);
        }
      } catch (err) {
        console.warn('Backend offline or not reachable, using seeded industrial dataset', err);
      }
    }
    loadData();
  }, []);

  // Monitor Network Connectivity & PWA Sync
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const syncedCount = await syncPendingQueueWithBackend();
      if (syncedCount > 0) {
        setPendingQueueCount(getPendingSyncQueue().length);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setPendingQueueCount(getPendingSyncQueue().length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handler: Create new Ticket
  const handleCreateTicket = async (ticketData: any) => {
    const newId = `tkt-${Date.now()}`;
    const newCode = `CH-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: Ticket = {
      id: newId,
      code: newCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requesterName: ticketData.requesterName || currentUser.name,
      requesterEmail: ticketData.requesterEmail || currentUser.email,
      requesterDepartment: ticketData.requesterDepartment || currentUser.department || 'Operações',
      client: ticketData.client || 'Cliente Corporativo',
      unit: ticketData.unit || 'Planta Principal',
      area: ticketData.area || 'CAG',
      assetId: ticketData.assetId || 'ast-1',
      assetTag: ticketData.assetTag || 'CHL-01',
      assetName: ticketData.assetName || 'Chiller York 500 TR',
      type: ticketData.type || 'CORRETIVA_EMERGENCIAL',
      subType: ticketData.subType || 'Falha de Operação',
      description: ticketData.description || 'Ocorrência registrada no sistema.',
      priority: ticketData.priority || 'P2',
      criticality: ticketData.criticality || 'A',
      slaHours: ticketData.slaHours || 4,
      deadline: new Date(Date.now() + (ticketData.slaHours || 4) * 3600000).toISOString(),
      status: 'NOVO',
      team: 'Equipe Alpha — Refrigeração Pesada',
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'NOVO',
          author: ticketData.requesterName || currentUser.name,
          description: 'Chamado cadastrado via Central MFV.',
        },
      ],
      checklistTemplateId: 'chk-chiller',
      billing: {
        laborCost: 0,
        materialsCost: 0,
        travelCost: 0,
        totalCost: 0,
        status: 'ORCADO',
      },
    };

    const updatedTickets = [newTicket, ...tickets];
    setTickets(updatedTickets);

    if (isOnline) {
      try {
        await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTicket),
        });
      } catch (err) {
        queueOfflineAction('CREATE_TICKET', newTicket);
        setPendingQueueCount(getPendingSyncQueue().length);
      }
    } else {
      queueOfflineAction('CREATE_TICKET', newTicket);
      setPendingQueueCount(getPendingSyncQueue().length);
    }

    setIsNewTicketModalOpen(false);
    setSelectedTicket(newTicket);
  };

  // Handler: Update Ticket Status (with timeline audit trail)
  const handleUpdateTicketStatus = async (
    ticketId: string,
    newStatus: TicketStatus,
    note?: string
  ) => {
    const updatedTickets = tickets.map((t) => {
      if (t.id === ticketId) {
        const newTimeline = [
          ...(t.timeline || []),
          {
            id: `tl-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: newStatus,
            author: `${currentUser.name} (${userRole})`,
            description: note || `Status alterado para ${newStatus}.`,
            note,
          },
        ];
        return {
          ...t,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          timeline: newTimeline,
        };
      }
      return t;
    });

    setTickets(updatedTickets);

    const changedTicket = updatedTickets.find((t) => t.id === ticketId);
    if (selectedTicket && selectedTicket.id === ticketId && changedTicket) {
      setSelectedTicket(changedTicket);
    }

    if (isOnline) {
      try {
        await fetch(`/api/tickets/${ticketId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, note, author: currentUser.name }),
        });
      } catch (err) {
        queueOfflineAction('UPDATE_STATUS', { ticketId, status: newStatus, note });
        setPendingQueueCount(getPendingSyncQueue().length);
      }
    } else {
      queueOfflineAction('UPDATE_STATUS', { ticketId, status: newStatus, note });
      setPendingQueueCount(getPendingSyncQueue().length);
    }
  };

  // Handler: Dispatch / Allocate Technician
  const handleConfirmDispatch = async (
    techId: string,
    techName: string,
    internalNote?: string
  ) => {
    if (!dispatchTicket) return;
    const ticketId = dispatchTicket.id;

    const updatedTickets = tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'PROGRAMADO' as TicketStatus,
          assignedTechId: techId,
          assignedTechName: techName,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...(t.timeline || []),
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toISOString(),
              status: 'PROGRAMADO' as TicketStatus,
              author: `${currentUser.name} (PCM)`,
              description: `Alocado ao técnico especialista ${techName}. ${internalNote || 'Ordem despachada.'}`,
              note: internalNote,
            },
          ],
        };
      }
      return t;
    });

    setTickets(updatedTickets);

    // Update technician status to assigned
    setTechnicians(
      technicians.map((tc) =>
        tc.id === techId ? { ...tc, status: 'EM_DESLOCAMENTO', openAssigned: tc.openAssigned + 1 } : tc
      )
    );

    if (isOnline) {
      try {
        await fetch(`/api/tickets/${ticketId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ techId, note: internalNote }),
        });
      } catch (err) {
        console.error(err);
      }
    }

    setDispatchTicket(null);
  };

  // Handler: Save Field Execution from Mobile App
  const handleSaveExecution = async (ticketId: string, executionData: any) => {
    const updatedTickets = tickets.map((t) => {
      if (t.id === ticketId) {
        const matCost = executionData.materialsUsed?.reduce((acc: number, m: any) => acc + (m.cost || 0), 0) || 0;
        const labCost = (executionData.laborHours || 0) * 150;
        const travCost = (executionData.travelHours || 0) * 80;

        return {
          ...t,
          status: 'CONCLUIDO' as TicketStatus,
          execution: executionData,
          billing: {
            laborCost: labCost,
            materialsCost: matCost,
            travelCost: travCost,
            totalCost: labCost + matCost + travCost,
            status: 'EXECUTADO' as const,
          },
        };
      }
      return t;
    });

    setTickets(updatedTickets);

    if (isOnline) {
      try {
        await fetch(`/api/tickets/${ticketId}/execution`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(executionData),
        });
      } catch (e) {
        queueOfflineAction('SAVE_EXECUTION', { ticketId, executionData });
        setPendingQueueCount(getPendingSyncQueue().length);
      }
    } else {
      queueOfflineAction('SAVE_EXECUTION', { ticketId, executionData });
      setPendingQueueCount(getPendingSyncQueue().length);
    }
  };

  // Handler: Generate Monthly Preventive Orders in Batch
  const handleGenerateMonthlyOrders = async () => {
    const generated: Ticket[] = preventivePlans.map((plan, i) => ({
      id: `tkt-prv-${Date.now()}-${i}`,
      code: `CH-PRV-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requesterName: 'Módulo PMOC Automático',
      requesterEmail: 'pcm@mfv.com.br',
      requesterDepartment: 'Engenharia de Manutenção',
      client: plan.client,
      unit: plan.unit,
      area: 'Planta de Refrigeração',
      assetId: plan.assetId,
      assetTag: plan.assetTag,
      assetName: plan.assetName,
      type: 'PREVENTIVA' as const,
      subType: plan.title,
      description: `Execução de rotina preventiva periódica (${plan.periodicity}) conforme plano e matriz PMOC.`,
      priority: plan.status === 'VENCIDA' ? 'P1' : 'P3',
      criticality: 'A',
      slaHours: 24,
      deadline: new Date(Date.now() + 86400000).toISOString(),
      status: 'PROGRAMADO',
      assignedTechId: plan.responsibleTechId,
      assignedTechName: plan.responsibleTechName,
      team: plan.responsibleTeam,
      checklistTemplateId: plan.checklistTemplateId,
      billing: {
        laborCost: 450,
        materialsCost: 150,
        travelCost: 60,
        totalCost: 660,
        status: 'ORCADO',
      },
      timeline: [
        {
          id: `tl-gen-${Date.now()}-${i}`,
          timestamp: new Date().toISOString(),
          status: 'PROGRAMADO',
          author: 'Módulo PMOC Automático',
          description: 'Ordem gerada periodicamente pelo plano de manutenção preventiva.',
        },
      ],
    }));

    setTickets([...generated, ...tickets]);
    alert(`${generated.length} ordens de manutenção preventivas foram geradas e agendadas com sucesso no PCM!`);
  };

  // Navigation from QR code scan
  const handleQrAssetDetected = (asset: Asset, action: 'OPEN_TICKET' | 'VIEW_ASSET' | 'START_SERVICE') => {
    setIsQrScannerOpen(false);
    if (action === 'OPEN_TICKET') {
      setPreselectedAsset(asset);
      setIsNewTicketModalOpen(true);
    } else if (action === 'VIEW_ASSET') {
      setCurrentTab('ATIVOS');
    } else if (action === 'START_SERVICE') {
      setCurrentTab('TECNICO_APP');
    }
  };

  // Switch role or view based on demo step
  const handleStepSelectFromDemo = (viewTargetNum: number) => {
    setIsDemoFlowOpen(false);
    switch (viewTargetNum) {
      case 2:
        setCurrentTab('CHAMADOS');
        break;
      case 4:
        setCurrentTab('MAPA');
        break;
      case 6:
        // Set technician user
        const techUser = users.find((u) => u.role === 'TECNICO') || users[2];
        setCurrentUser(techUser);
        setCurrentTab('TECNICO_APP');
        break;
      case 8:
        setCurrentTab('MANU_IA');
        break;
      case 10:
        const adminUser = users.find((u) => u.role === 'ADMINISTRADOR') || users[0];
        setCurrentUser(adminUser);
        setCurrentTab('INTEGRACAO_SAP');
        break;
      default:
        setCurrentTab('DASHBOARD');
    }
  };

  // Counts for Badges
  const criticalCount = tickets.filter(
    (t) => t.priority === 'P1' && t.status !== 'CONCLUIDO' && t.status !== 'CANCELADO'
  ).length;

  const openTicketsCount = tickets.filter(
    (t) => t.status !== 'CONCLUIDO' && t.status !== 'CANCELADO'
  ).length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-orange-500 selection:text-white">
      {/* Left Navigation Menu (Sleek Dark Sidebar) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        userRole={userRole}
        currentUser={currentUser}
        openTicketsCount={openTicketsCount}
        criticalCount={criticalCount}
      />

      {/* Main Content Area (Sleek Light Interface) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        {/* Top Header Navbar */}
        <Navbar
          currentUser={currentUser}
          users={users}
          onSelectUser={(user) => setCurrentUser(user)}
          isOnline={isOnline}
          onToggleOnline={() => setIsOnline(!isOnline)}
          onOpenQrScanner={() => setIsQrScannerOpen(true)}
          onStartDemoFlow={() => setIsDemoFlowOpen(true)}
          onOpenNewTicket={() => {
            setPreselectedAsset(null);
            setIsNewTicketModalOpen(true);
          }}
          pendingSyncCount={pendingQueueCount}
          criticalTicketsCount={criticalCount}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />

        {/* Scrollable View Content Router */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50">
          {currentTab === 'DASHBOARD' && (
            <DashboardView
              tickets={tickets}
              assets={assets}
              technicians={technicians}
              preventivePlans={preventivePlans}
              pcmDb={pcmDb}
              onSelectTicket={(t) => setSelectedTicket(t)}
              onSelectTab={(tab) => setCurrentTab(tab)}
              onOpenNewTicket={() => {
                setPreselectedAsset(null);
                setIsNewTicketModalOpen(true);
              }}
              onStartDemoFlow={() => setIsDemoFlowOpen(true)}
            />
          )}

          {currentTab === 'PROGRAMACAO_ANUAL' && (
            <AnnualScheduleView pcmDb={pcmDb} onUpdatePcmDb={setPcmDb} />
          )}

          {currentTab === 'VISAO_MENSAL' && (
            <MonthlyScheduleView pcmDb={pcmDb} />
          )}

          {currentTab === 'VISAO_ANUAL' && (
            <AnnualHeatmapView pcmDb={pcmDb} />
          )}

          {currentTab === 'PMOC_EQUIPAMENTOS' && (
            <PmocEquipmentsView pcmDb={pcmDb} />
          )}

          {currentTab === 'CONFERENCIA_SAP' && (
            <SapReconciliationView pcmDb={pcmDb} onUpdatePcmDb={setPcmDb} />
          )}

          {currentTab === 'IMPORTAR_BASE' && (
            <ImportBaseView
              pcmDb={pcmDb}
              onUpdatePcmDb={setPcmDb}
              modoOperacao={modoOperacao}
              onToggleModoOperacao={setModoOperacao}
            />
          )}

          {currentTab === 'CHAMADOS' && (
            <TicketsView
              tickets={tickets}
              assets={assets}
              userRole={userRole}
              onSelectTicket={(t) => setSelectedTicket(t)}
              onOpenNewTicketModal={() => {
                setPreselectedAsset(null);
                setIsNewTicketModalOpen(true);
              }}
              onOpenDispatchModal={(t) => setDispatchTicket(t)}
              onOpenReportModal={(t) => setReportTicket(t)}
            />
          )}

          {currentTab === 'AGENDA' && (
            <ScheduleView
              technicians={technicians}
              tickets={tickets}
              preventivePlans={preventivePlans}
              onSelectTicket={(t) => setSelectedTicket(t)}
              onOpenNewTicket={() => {
                setPreselectedAsset(null);
                setIsNewTicketModalOpen(true);
              }}
            />
          )}

          {(currentTab === 'MAPA' || currentTab === 'ROTAS') && (
            <TeamMapView
              technicians={technicians}
              tickets={tickets}
              assets={assets}
              onSelectTicket={(t) => setSelectedTicket(t)}
              onSelectTech={(tech) => console.log('Selected tech', tech)}
              activeSubTab={currentTab === 'ROTAS' ? 'ROUTING' : 'MAP'}
            />
          )}

          {currentTab === 'ATIVOS' && (
            <AssetsView
              assets={assets}
              tickets={tickets}
              onSelectTicket={(t) => setSelectedTicket(t)}
              onOpenNewTicketForAsset={(asset) => {
                setPreselectedAsset(asset);
                setIsNewTicketModalOpen(true);
              }}
            />
          )}

          {currentTab === 'PREVENTIVAS' && (
            <PreventivesView
              preventivePlans={preventivePlans}
              onSelectPlan={(plan) => console.log('Plan selected', plan)}
              onGenerateMonthlyOrders={handleGenerateMonthlyOrders}
            />
          )}

          {currentTab === 'CHECKLISTS' && (
            <ChecklistsView
              checklistTemplates={checklistTemplates}
              onSelectTemplate={(tpl) => console.log('Template selected', tpl)}
            />
          )}

          {currentTab === 'TECNICO_APP' && (
            <TechnicianMobileApp
              technician={technicians[0]}
              tickets={tickets}
              assets={assets}
              checklistTemplates={checklistTemplates}
              onUpdateTicketStatus={(id, st, n) => handleUpdateTicketStatus(id, st, n)}
              onSaveExecution={handleSaveExecution}
              onOpenReportModal={(t) => setReportTicket(t)}
              isOnline={isOnline}
              onOpenQrScanner={() => setIsQrScannerOpen(true)}
            />
          )}

          {currentTab === 'MANU_IA' && (
            <ManuAiAssistant assets={assets} tickets={tickets} />
          )}

          {currentTab === 'FINANCEIRO' && (
            <FinancialView tickets={tickets} />
          )}

          {currentTab === 'RELATORIOS_BI' && (
            <ReportsBiView
              tickets={tickets}
              assets={assets}
              technicians={technicians}
            />
          )}

          {currentTab === 'INTEGRACAO_SAP' && (
            <SapIntegrationView tickets={tickets} />
          )}
        </div>

        {/* Sleek Interface Telemetry Footer Bar */}
        <footer className="h-10 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-[10px] font-medium text-slate-500 uppercase tracking-widest shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              SLA GLOBAL: 98.2%
            </span>
            <span className="hidden sm:inline">STORAGE: 2.4TB</span>
            <span className="hidden md:inline">CLIENTES: 142 UNIDADES</span>
          </div>
          <div>© 2026 MFV FIELD VISION — TECNOLOGIA PARA MANUTENÇÃO INDUSTRIAL</div>
        </footer>
      </main>

      {/* --- Global Modals Layer --- */}

      {/* 1. New Ticket Modal */}
      {isNewTicketModalOpen && (
        <NewTicketModal
          assets={assets}
          preselectedAsset={preselectedAsset}
          onClose={() => {
            setIsNewTicketModalOpen(false);
            setPreselectedAsset(null);
          }}
          onSubmit={handleCreateTicket}
        />
      )}

      {/* 2. Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          userRole={userRole}
          onClose={() => setSelectedTicket(null)}
          onUpdateStatus={(newStatus, note) =>
            handleUpdateTicketStatus(selectedTicket.id, newStatus, note)
          }
          onOpenDispatch={() => {
            const current = selectedTicket;
            setSelectedTicket(null);
            setDispatchTicket(current);
          }}
          onOpenReport={() => {
            const current = selectedTicket;
            setSelectedTicket(null);
            setReportTicket(current);
          }}
          onOpenTechApp={() => {
            setSelectedTicket(null);
            setCurrentTab('TECNICO_APP');
          }}
        />
      )}

      {/* 3. Technician Dispatch & AI Recommendation Modal */}
      {dispatchTicket && (
        <TechnicianDispatchModal
          ticket={dispatchTicket}
          onClose={() => setDispatchTicket(null)}
          onConfirmDispatch={handleConfirmDispatch}
        />
      )}

      {/* 4. QR Code Scanner / Camera Simulation Modal */}
      {isQrScannerOpen && (
        <QrCodeScannerModal
          assets={assets}
          userRole={userRole}
          onClose={() => setIsQrScannerOpen(false)}
          onAssetDetected={handleQrAssetDetected}
        />
      )}

      {/* 5. Formal Technical Report / OS Print Modal */}
      {reportTicket && (
        <TechnicalReportModal
          ticket={reportTicket}
          asset={assets.find((a) => a.id === reportTicket.assetId || a.tag === reportTicket.assetTag)}
          onClose={() => setReportTicket(null)}
        />
      )}

      {/* 6. Guided Scenario Golden Demo Modal */}
      {isDemoFlowOpen && (
        <GuidedDemoFlow
          onSelectStep={handleStepSelectFromDemo}
          onClose={() => setIsDemoFlowOpen(false)}
        />
      )}
    </div>
  );
}
