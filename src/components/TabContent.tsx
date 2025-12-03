import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import CodeList from './CodeList';
import CodeHistory from './CodeHistory';
import Dashboard from './Dashboard';
import ProductRegistration from './ProductRegistration';
import ProductPriceRegistration from './ProductPriceRegistration';
import AgentRegistration from './AgentRegistration';
import CustRegistration from './custRegistration';
import SalesRegistration from './salesRegistration';
import OrderRegistration from './OrderRegistration';
import OrderListManagement from './OrderListManagement';
import TradeStatus from './tradeStatus';
import OrderConfirm from './OrderConfirm';
import OrderOutStatus from './orderOutStatus';
import AgentStock from './AgentStock';
import StoreInventoryManagement from './storeInventoryManagement';
import StoreInventoryStatus from './storeInventoryStatus';
import InOutStatus from './inOutStatus';
import UserManagement from './UserManagement';
import MenuManagement from './MenuManagement';
import CustomerSalesDaily from './customerSalesDaily';
import SalesPersonausipt from './salesPersonausipt';
import DailySalesStatus from './dailySalesStatus';
import CustomerSegmentStatus from './CustomerSegmentStatus';
import DormantCustomerAnalysis from './DormantCustomerAnalysis';
import PurchasePatternAnalysis from './PurchasePatternAnalysis';
import StaffPerformanceAnalysis from './StaffPerformanceAnalysis';
import CustomerJourneyAnalysis from './CustomerJourneyAnalysis';
import SalesByVendorBrand from './SalesByVendorBrand';
import OrderInByVendor from './OrderInByVendor';

// CRM 대시보드 컴포넌트들
import {
  CRMDashboard,
  ProductAnalysisDashboard,
  CustomerIntegrationDashboard,
  CampaignAnalyticsDashboard,
  CustomerLoyaltyDashboard,
  ReferralAnalyticsDashboard,
  AgentCallAnalyticsDashboard,
  DemographicAnalyticsDashboard,
  ChannelAnalyticsDashboard,
  AdvancedGrowthAnalyticsDashboard,
  AdvancedDistributionCharts,
  ProfessionalAnalyticsDashboard,
  MISDashboard,
  CRMNavigation
} from './crm';

interface TabContentProps {
  tabId: string;
}

const TabContent: React.FC<TabContentProps> = React.memo(({ tabId }) => {
  const tabs = useSelector((state: RootState) => state.tabs.tabs);
  const tab = tabs.find(t => t.id === tabId);

  console.log('TabContent: tabId:', tabId);
  console.log('TabContent: tabs:', tabs);
  console.log('TabContent: tab:', tab);

  if (!tab) {
    return <div className="component-wrapper">탭을 찾을 수 없습니다.</div>;
  }

  // 컴포넌트 렌더링
  const renderComponent = (component: string) => {
    console.log('TabContent: 렌더링할 컴포넌트:', component);

    const normalizedComponent = component.toLowerCase();
    if (
      normalizedComponent.includes('agentstock') ||
      normalizedComponent.includes('realtimeinventory') ||
      normalizedComponent.includes('실시간매장재고')
    ) {
      return <AgentStock />;
    }
    // 입출고 현황(다양한 표기 허용) 처리
    if (
      normalizedComponent.includes('inoutstatus') ||
      normalizedComponent.includes('in-out-status') ||
      normalizedComponent.includes('입출고') ||
      normalizedComponent.includes('입출고현황')
    ) {
      return <InOutStatus />;
    }

    switch (component) {
      case 'WelcomeMessage':
        return <WelcomeMessage />;
      case 'Dashboard':
        return <Dashboard />;
      
      // 코드 관리
      case 'CodeList':
        return <CodeList />;
      case 'CodeHistory':
        return <CodeHistory />;
      case 'CodeCreate':
        return <CodeCreate />;
      case 'CodeEdit':
        return <CodeEdit />;
      case 'CodeCategory':
        return <CodeCategory />;
      
      // 상품 관리
      case 'ProductManage':
      case 'ProductRegistration':
        return <ProductRegistration />;
      case 'PriceManage':
        return <ProductPriceRegistration />;
      
      // 거래처 관리
      case 'AgentRegistration':
        return <AgentRegistration />;
      
      // 고객 관리
      case 'CustRegistration':
        return <CustRegistration />;
      
      // 판매 관리
      case 'SalesRegistration':
        return <SalesRegistration />;
      
      // 사용자 관리
      case 'UserManagement':
        return <UserManagement />;
      
      // 메뉴 관리
      case 'MenuManagement':
        console.log('TabContent: MenuManagement 컴포넌트 렌더링');
        return <MenuManagement />;
      
      // 발주 관리
      case 'OrderRegistration':
        console.log('TabContent: OrderRegistration 컴포넌트 렌더링');
        return <OrderRegistration />;
      case 'OrderListManagement':
        console.log('TabContent: OrderListManagement 컴포넌트 렌더링');
        return <OrderListManagement />;
      case 'TradeStatus':
      case 'tradeStatus':
      case '거래내역':
      case '거래 내역':
        return <TradeStatus />;
      case 'OrderOutStatus':
      case 'orderOutStatus':
      case '출고현황':
        return <OrderOutStatus />;
      case 'StoreInventoryManagement':
      case 'storeInventoryManagement':
      case '입고관리':
        return <StoreInventoryManagement />;
      case 'StoreInventoryStatus':
      case 'storeInventoryStatus':
      case '입고현황':
        return <StoreInventoryStatus />;
      case 'InOutStatus':
      case 'inOutStatus':
      case '입출고현황':
        return <InOutStatus />;
      
      // 주문 관리
      case 'OrderList':
        return <div className="component-placeholder">주문 목록 컴포넌트</div>;
      case 'OrderCreate':
        return <div className="component-placeholder">주문 생성 컴포넌트</div>;
      case 'OrderStatus':
        return <div className="component-placeholder">주문 상태 컴포넌트</div>;
      case 'OrderCheck':
        return <div className="component-placeholder">주문 확인 컴포넌트</div>;
      case 'OrderHistory':
        return <div className="component-placeholder">주문 이력 컴포넌트</div>;
      case 'ShipmentProcess':
      case 'OrderConfirm':
      case '출고처리':
      case '출고확정':
        console.log('TabContent: OrderConfirm (출고확정) 컴포넌트 렌더링');
        return <OrderConfirm />;
      
      // 고객판매일보
      case 'CustomerSalesDaily':
      case 'customerSalesDaily':
      case '고객판매일보':
        return <CustomerSalesDaily />;
      
      // 판매사원 AUS-IPT
      case 'SalesPersonausipt':
      case 'salesPersonausipt':
      case '판매사원AUS-IPT':
        return <SalesPersonausipt />;
      
      // 일일매출현황
      case 'DailySalesStatus':
      case 'dailySalesStatus':
      case '일일매출현황':
        return <DailySalesStatus />;
      
      // 고객구분현황 (CRM 분석)
      case 'CustomerSegmentStatus':
      case 'customerSegmentStatus':
      case '고객구분현황':
        return <CustomerSegmentStatus />;
      
      // 휴면고객분석 (CRM 분석)
      case 'DormantCustomerAnalysis':
      case 'dormantCustomerAnalysis':
      case '휴면고객분석':
        return <DormantCustomerAnalysis />;
      
      // 구매패턴분석 (CRM 분석)
      case 'PurchasePatternAnalysis':
      case 'purchasePatternAnalysis':
      case '구매패턴분석':
        return <PurchasePatternAnalysis />;
      
      // 판매사원성과분석 (CRM 분석)
      case 'StaffPerformanceAnalysis':
      case 'staffPerformanceAnalysis':
      case '판매사원성과분석':
        return <StaffPerformanceAnalysis />;
      
      // 고객구매여정 (CRM 분석)
      case 'CustomerJourneyAnalysis':
      case 'customerJourneyAnalysis':
      case '고객구매여정':
        return <CustomerJourneyAnalysis />;
      
      // 매입처(벤더) 브랜드별 매출내역 (리포트)
      case 'SalesByVendorBrand':
      case 'salesByVendorBrand':
      case '매입처브랜드별매출내역':
      case '매입처(벤더)브랜드별매출내역':
      case '벤더브랜드별매출':
        return <SalesByVendorBrand />;
      
      // 매입처별 발주/입고내역 (리포트)
      case 'OrderInByVendor':
      case 'orderInByVendor':
      case '매입처별발주입고내역':
      case '매입처별발주/입고내역':
      case '매입처별 발주/입고내역':
      case '발주입고내역':
        return <OrderInByVendor />;
      
      // 매출 정보
      case 'SalesDaily':
        return <div className="component-placeholder">일별 매출 컴포넌트</div>;
      case 'SalesMonthly':
        return <div className="component-placeholder">월별 매출 컴포넌트</div>;
      case 'SalesAnalysis':
        return <div className="component-placeholder">매출 분석 컴포넌트</div>;
      
      // 재고 정보
      case 'InventoryList':
        return <div className="component-placeholder">재고 목록 컴포넌트</div>;
      case 'InventoryAlert':
        return <div className="component-placeholder">재고 알림 컴포넌트</div>;
      case 'InventoryStatus':
        return <div className="component-placeholder">재고 상태 컴포넌트</div>;
      case 'InventoryReport':
        return <div className="component-placeholder">재고 리포트 컴포넌트</div>;
      
      // CRM 대시보드
      case 'CRMDashboard':
        console.log('TabContent: CRMDashboard 컴포넌트 렌더링 중...');
        return <CRMDashboard />;
      case 'CRMNavigation':
        return <CRMNavigation />;
      case 'ProductAnalysisDashboard':
        return <ProductAnalysisDashboard />;
      case 'CustomerIntegrationDashboard':
        return <CustomerIntegrationDashboard />;
      case 'CampaignAnalyticsDashboard':
        return <CampaignAnalyticsDashboard />;
      case 'CustomerLoyaltyDashboard':
        return <CustomerLoyaltyDashboard />;
      case 'ReferralAnalyticsDashboard':
        return <ReferralAnalyticsDashboard />;
      case 'AgentCallAnalyticsDashboard':
        return <AgentCallAnalyticsDashboard />;
      case 'DemographicAnalyticsDashboard':
        return <DemographicAnalyticsDashboard />;
      case 'ChannelAnalyticsDashboard':
        return <ChannelAnalyticsDashboard />;
      case 'AdvancedGrowthAnalyticsDashboard':
        return <AdvancedGrowthAnalyticsDashboard />;
      case 'AdvancedDistributionCharts':
        return <AdvancedDistributionCharts />;
      case 'ProfessionalAnalyticsDashboard':
        return <ProfessionalAnalyticsDashboard />;
      case 'MISDashboard':
        return <MISDashboard />;
      
      default:
        return <div className="component-placeholder">컴포넌트를 찾을 수 없습니다: {component}</div>;
    }
  };

  return (
    <div className="component-wrapper">
      {renderComponent(tab.component)}
    </div>
  );
});

// 컴포넌트들
const WelcomeMessage: React.FC = () => (
  <div className="welcome-message">
    <h1>HD SYNC 시스템에 오신 것을 환영합니다</h1>
    <p>좌측 메뉴에서 원하는 기능을 선택하여 시작하세요.</p>
  </div>
);

// 코드 관리 컴포넌트들
const CodeCreate: React.FC = () => (
  <div className="dashboard-component">
    <h1>코드 생성</h1>
    <p>새로운 코드를 생성하는 페이지입니다.</p>
    <div className="content-placeholder">
      <p>코드 생성 폼이 여기에 표시됩니다.</p>
    </div>
  </div>
);

const CodeEdit: React.FC = () => (
  <div className="dashboard-component">
    <h1>코드 수정</h1>
    <p>기존 코드를 수정하는 페이지입니다.</p>
    <div className="content-placeholder">
      <p>코드 수정 폼이 여기에 표시됩니다.</p>
    </div>
  </div>
);

const CodeCategory: React.FC = () => (
  <div className="dashboard-component">
    <h1>코드 분류</h1>
    <p>코드 분류를 관리하는 페이지입니다.</p>
    <div className="content-placeholder">
      <p>코드 분류 관리 화면이 여기에 표시됩니다.</p>
    </div>
  </div>
);



export default TabContent;
