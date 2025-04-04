
import * as sql from 'mssql';
import { dbConfig } from '@/utils/dbConfig';

/**
 * Test the database connection with current settings
 */
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.close();
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    console.error('Database connection error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown database connection error' 
    };
  }
};

/**
 * Execute a query against the MSSQL database
 */
export const executeQuery = async <T>(query: string, params?: any[]): Promise<T[]> => {
  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    
    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }
    
    const result = await request.query(query);
    await pool.close();
    
    return result.recordset as T[];
  } catch (error) {
    console.error('Query execution error:', error);
    throw new Error(error instanceof Error ? error.message : 'Unknown query execution error');
  }
};
