const supabase = require("../config/supabase");

class Employee {
  static async create({ employee_number, name, role_id, department_id, hire_date, status }) {
    const { data, error } = await supabase
      .from("employees")
      .insert([{ employee_number, name, role_id, department_id, hire_date, status }]);

    if (error) throw new Error(error.message);
    return data;
  }

  static async getAll() {
    const { data, error } = await supabase.from("employees").select("*");
    if (error) throw new Error(error.message);
    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase.from("employees").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id, updateFields) {
    const { data, error } = await supabase.from("employees").update(updateFields).eq("id", id);
    if (error) throw new Error(error.message);
    return data;
  }

  static async delete(id) {
    const { data, error } = await supabase.from("employees").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return data;
  }
}

module.exports = Employee;
