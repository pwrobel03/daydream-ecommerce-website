// prisma/data/users.ts
export const users = [
  {
    name: "Piotr Nexus",
    email: "piotr@nexus.com",
    password: "password123",
    role: "ADMIN" as const,
    address: {
      fullName: "Piotr Nexus",
      street: "Cyberpunk Ave 77",
      city: "Neo-Warsaw",
      zipCode: "00-001",
      phone: "+48 111 222 333",
    }
  },
  {
    name: "Ewa Artifact",
    email: "ewa@essence.com",
    password: "password123",
    role: "USER" as const,
    address: {
      fullName: "Ewa Artifact",
      street: "Molecular St 12",
      city: "Kraków",
      zipCode: "31-000",
      phone: "+48 555 666 777",
    }
  },
  {
    name: "Viktor Void",
    email: "viktor@void.io",
    password: "password123",
    role: "USER" as const,
    address: {
      fullName: "Viktor Void",
      street: "Deep Space Road 9",
      city: "Gdańsk",
      zipCode: "80-001",
      phone: "+48 999 888 777",
    }
  },
  {
    name: "Luna Signal",
    email: "luna@signal.net",
    password: "password123",
    role: "USER" as const,
    address: {
      fullName: "Luna Signal",
      street: "Frequency Lane 4",
      city: "Wrocław",
      zipCode: "50-001",
      phone: "+48 444 333 222",
    }
  },
  {
    name: "Marcus Core",
    email: "marcus@core.com",
    password: "password123",
    role: "USER" as const,
    address: {
      fullName: "Marcus Core",
      street: "Steel Plaza 1",
      city: "Łódź",
      zipCode: "90-001",
      phone: "+48 666 555 444",
    }
  }
];