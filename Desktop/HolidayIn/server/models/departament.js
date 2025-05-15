const supabase = require("../config/supabase");

class Department {
  static async create(name) {
    const { data, error } = await supabase
      .from("departments")
      .insert([{ name }]);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async getAll() {
    const { data, error } = await supabase
      .from("departments")
      .select("*");

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async update(id, name) {
    const { data, error } = await supabase
      .from("departments")
      .update({ name })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async delete(id) {
    const { data, error } = await supabase
      .from("departments")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

module.exports = Department;
