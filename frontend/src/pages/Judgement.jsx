import React from 'react'
import { FileText, CheckCircle, Clock, Star } from 'lucide-react'
import {
  Header,
  SearchFilters,
  StatisticCard,
  Sidebar,
  JudgementTable,
  Pagination,
  LegalPointsSection,
} from '../components/judgements'

export default function Judgement() {
  return (
    <div className="font-inter min-h-screen -m-[36px_32px_40px] lg:-m-0 lg:m-[-36px_-32px_-40px]" style={{ margin: '-36px -32px -40px', background: '#f9fafb' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ─── Header ────────────────────────────────────────── */}
        <Header
          title="Judgements"
          subtitle="Search, manage and refer to important judgements with key legal points."
          onAddNew={() => {}}
          onToggleTheme={() => {}}
          onHelp={() => {}}
        />

        {/* ─── Search & Filters ──────────────────────────────── */}
        <SearchFilters
          searchValue=""
          onSearchChange={() => {}}
          categories={[]}
          courts={[]}
          years={[]}
        />

        {/* ─── Statistics Cards ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatisticCard
            icon={FileText}
            iconBgColor="bg-violet-100"
            iconColor="text-violet-600"
            title="Total Judgements"
            value={null}
            subtitle="Across all categories"
          />
          <StatisticCard
            icon={CheckCircle}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
            title="With Legal Points"
            value={null}
            subtitle="Judgements analyzed"
          />
          <StatisticCard
            icon={Clock}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            title="Recent Additions"
            value={null}
            subtitle="In last 30 days"
          />
          <StatisticCard
            icon={Star}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
            title="Favourite Judgements"
            value={null}
            subtitle="Marked as important"
          />
        </div>

        {/* ─── Main Content: Sidebar + Table ─────────────────── */}
        <div className="flex flex-col lg:flex-row gap-5 mb-6">
          {/* Categories Sidebar */}
          <Sidebar
            categories={null}
            activeCategory={null}
            onCategorySelect={() => {}}
          />

          {/* Table + Pagination */}
          <div className="flex-1 min-w-0">
            <JudgementTable
              judgements={null}
              totalCount={null}
              onToggleFavourite={() => {}}
              onView={() => {}}
              onCopy={() => {}}
              onMore={() => {}}
            />

            {/* Pagination */}
            <Pagination
              currentPage={1}
              totalPages={1}
              totalItems={null}
              pageSize={5}
              onPageChange={() => {}}
            />
          </div>
        </div>

        {/* ─── Legal Points Section ──────────────────────────── */}
        <LegalPointsSection
          legalPoints={null}
          caseTitle={null}
          caseDetails={null}
          totalPoints={null}
          onAddPoint={() => {}}
          onViewAll={() => {}}
          onEditPoint={() => {}}
          onDeletePoint={() => {}}
        />
      </div>
    </div>
  )
}
