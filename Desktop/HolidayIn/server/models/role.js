const supabase = require("../config/supabase");

class Role {

    
  static async create(name, department_id, default_start_time, default_end_time) {
    const { data, error } = await supabase
      .from("roles")
      .insert([{ name, department_id, default_start_time, default_end_time }]);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async getAll() {
    const { data, error } = await supabase
      .from("roles")
      .select("*");

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async update(id, name, department_id, default_start_time, default_end_time) {
    const { data, error } = await supabase
      .from("roles")
      .update({ name, department_id, default_start_time, default_end_time })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async delete(id) {
    const { data, error } = await supabase
      .from("roles")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

module.exports = Role;
