import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ระบบปรับปรุงข้อมูลคณะทำงานประจำศูนย์ไกล่เกลี่ยข้อพิพาทภาคประชาชน | กรมคุ้มครองสิทธิและเสรีภาพ',
  description: 'ระบบตรวจสอบและปรับปรุงข้อมูลเลขประจำตัวประชาชนและข้อมูลการติดต่อ คณะทำงานบริหารประจำศูนย์ไกล่เกลี่ยข้อพิพาทภาคประชาชน กรมคุ้มครองสิทธิและเสรีภาพ กระทรวงยุติธรรม',
};

export default function UpdateMediatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header หน่วยงาน */}
      <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                กรมคุ้มครองสิทธิและเสรีภาพ กระทรวงยุติธรรม
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                ระบบปรับปรุงข้อมูลคณะทำงานประจำศูนย์ไกล่เกลี่ยฯ
              </h1>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              ระบบออนไลน์
            </span>
          </div>
        </div>
      </header>

      {/* เนื้อหาหลัก */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p className="font-medium text-slate-700">กองส่งเสริมการระงับข้อพิพาท กรมคุ้มครองสิทธิและเสรีภาพ กระทรวงยุติธรรม</p>
          <p>พระราชบัญญัติการไกล่เกลี่ยข้อพิพาท พ.ศ. 2562</p>
          <p className="text-slate-400 text-[11px] pt-2">© สงวนลิขสิทธิ์ พ.ศ. 2569 ข้อมูลในระบบนี้ได้รับการคุ้มครองตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</p>
        </div>
      </footer>
    </div>
  );
}
