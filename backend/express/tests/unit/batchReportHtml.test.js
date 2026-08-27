import { buildStudentReportHtml } from '../../src/utils/batchReportHtml.js';

describe('buildStudentReportHtml', () => {
  it('renders subject rows with attendance and marks', () => {
    const html = buildStudentReportHtml({
      usn: '1MS23IS051',
      name: 'KARTHIK S POOJARY',
      details: {
        cgpa: '9.36',
        class_details: 'B.E-IS,  SEM 06,  SEC B',
        last_updated: '2026-03-28',
        subjects: [
          { name: 'Management', marks: 40, attendance: 65 },
        ],
      },
    });

    expect(html).toContain('1MS23IS051');
    expect(html).toContain('KARTHIK S POOJARY');
    expect(html).toContain('9.36');
    expect(html).toContain('Management');
    expect(html).toContain('65%');
    expect(html).toContain('low-attendance');
    expect(html).toContain('40 / 50');
  });

  it('falls back to a placeholder row when there is no subject data', () => {
    const html = buildStudentReportHtml({ usn: '1MS23IS999', name: 'No Data', details: {} });
    expect(html).toContain('No academic data available for the current semester.');
  });

  it('includes proctor remarks only when present, and escapes injected names', () => {
    const withRemarks = buildStudentReportHtml({
      usn: '1MS23IS051',
      name: '<script>alert(1)</script>',
      details: { subjects: [], remarks: '<p>Doing well</p>' },
    });
    expect(withRemarks).toContain('Doing well');
    expect(withRemarks).not.toContain('<script>alert(1)</script>');
    expect(withRemarks).toContain('&lt;script&gt;');

    const withoutRemarks = buildStudentReportHtml({
      usn: '1MS23IS052',
      name: 'No Remarks',
      details: { subjects: [] },
    });
    expect(withoutRemarks).not.toContain('Proctor Remarks');
  });
});
