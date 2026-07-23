/**
 * TableHeader — sticky column headers for the Judgements table.
 *
 * Columns are hardcoded here because they form the structural contract
 * of the table and should not change without a schema update.
 * Individual widths are controlled via CSS classes.
 */

const COLUMNS = [
  { label: 'Case Title / Parties', cls: 'jd-col-title'    },
  { label: 'Case Type',            cls: 'jd-col-type'     },
  { label: 'Case No.',             cls: 'jd-col-number'   },
  { label: 'Status',               cls: 'jd-col-status'   },
  { label: 'Last Modified',        cls: 'jd-col-modified' },
  { label: 'Actions',              cls: 'jd-col-actions'  },
]

export default function TableHeader() {
  return (
    <thead>
      <tr>
        {COLUMNS.map(({ label, cls }) => (
          <th key={label} scope="col" className={cls}>
            {label}
          </th>
        ))}
      </tr>
    </thead>
  )
}
