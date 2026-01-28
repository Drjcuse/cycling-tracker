interface UpdateField {
  column: string;
  value: any;
}

/**
 * Builds a dynamic UPDATE query with parameterized values
 * @param fields - Array of column names and values to update
 * @returns Object containing SQL string and parameter array
 */
export const buildUpdateQuery = (
  table: string,
  fields: UpdateField[],
  whereClause: string
): { query: string; params: any[] } => {
  const params: any[] = [];
  const updateFields: string[] = [];

  // Build SET clause
  fields.forEach(({ column, value }) => {
    params.push(value);
    updateFields.push(`${column} = $${params.length}`);
  });

  // Add WHERE parameter
  const whereParam = params.length + 1;

  const query = `
    UPDATE ${table} 
    SET ${updateFields.join(', ')} 
    ${whereClause.replace('?', `$${whereParam}`)}
    RETURNING *
  `;

  return { query, params };
};

/**
 * Maps object fields to database columns with snake_case conversion
 */
export const mapFieldToColumn = (fieldName: string): string => {
  // Convert camelCase to snake_case
  return fieldName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};