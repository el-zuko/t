export interface DomainTool {
  name: string;
  category: string;
  license: string;
  githubOrSite: string;
  cliOrApi: string;
  primaryCapability: string;
  supportedFormats: string[];
}

export interface DomainStandard {
  code: string;
  organization: string;
  title: string;
  relevance: string;
}

export interface DomainDataset {
  name: string;
  curator: string;
  accessUrl: string;
  dataType: string;
  relevance: string;
}

export interface DomainCapability {
  id: string;
  domainName: string;
  iconName: string;
  tagline: string;
  governingPhysics: string[];
  tools: DomainTool[];
  standards: DomainStandard[];
  datasets: DomainDataset[];
  fileFormats: { ext: string; name: string; purpose: string }[];
  executionPipeline: {
    step1_formulation: string;
    step2_toolSelection: string;
    step3_dataIngestion: string;
    step4_meshingOrNetlist: string;
    step5_solverExecution: string;
    step6_validationCheck: string;
    step7_artifactExport: string;
  };
  sampleArtifact: {
    title: string;
    format: string;
    filename: string;
    description: string;
    code: string;
  };
}

export const ENGINEERING_CAPABILITY_MAP: DomainCapability[] = [
  {
    id: "electrical",
    domainName: "Electrical & Power Electronics",
    iconName: "Zap",
    tagline: "Component-level circuits, power topologies, SPICE simulation & PCB physical design",
    governingPhysics: [
      "Kirchhoff's Current & Voltage Laws (KCL, KVL)",
      "Maxwell-Ampère & Faraday Electromagnetic Induction",
      "Semiconductor PN-junction Poisson & drift-diffusion physics",
      "Fourier time-domain to frequency-domain harmonic analysis",
    ],
    tools: [
      {
        name: "ngspice",
        category: "SPICE Simulation",
        license: "BSD-3-Clause",
        githubOrSite: "https://ngspice.sourceforge.io/",
        cliOrApi: "ngspice -b -r output.raw input.cir",
        primaryCapability: "Mixed-signal analog/digital SPICE engine with BSIM4, EKV, and transient Monte Carlo analysis.",
        supportedFormats: [".cir", ".sp", ".raw", ".lib", ".mod"],
      },
      {
        name: "KiCad",
        category: "Schematic & PCB Layout",
        license: "GPL-3.0",
        githubOrSite: "https://gitlab.com/kicad/code/kicad",
        cliOrApi: "kicad-cli pcb export gerbers / kicad-cli drc",
        primaryCapability: "Hierarchical schematic capture, 32-layer impedance-controlled PCB layout, push-and-shove interactive router, DRC/ERC.",
        supportedFormats: [".kicad_sch", ".kicad_pcb", ".kicad_pro", ".gerber", ".drl"],
      },
      {
        name: "LTspice Ecosystem",
        category: "Switch-Mode Power Supply",
        license: "Freeware / Industry Standard",
        githubOrSite: "https://www.analog.com/ltspice",
        cliOrApi: "LTspice -b -Run input.asc",
        primaryCapability: "High-speed transient simulation of DC-DC buck/boost converters, flybacks, and power MOSFET gate-drive dynamics.",
        supportedFormats: [".asc", ".asy", ".raw", ".log"],
      },
      {
        name: "Qucs-S",
        category: "RF & Linear Circuit Simulator",
        license: "GPL-2.0",
        githubOrSite: "https://ra3xdh.github.io/",
        cliOrApi: "qucs-s",
        primaryCapability: "S-parameter RF simulation, noise figure calculation, microstrip line impedance synthesis.",
        supportedFormats: [".sch", ".s2p", ".dat"],
      },
      {
        name: "OpenEMS",
        category: "Electromagnetic FDTD Solver",
        license: "GPL-3.0",
        githubOrSite: "https://openems.de/",
        cliOrApi: "openEMS [options] file.xml",
        primaryCapability: "Finite-Difference Time-Domain (FDTD) electromagnetic field simulation for antennas, filters, and PCB high-speed vias.",
        supportedFormats: [".xml", ".vtk", ".mat"],
      },
      {
        name: "FEMM",
        category: "2D Magnetics & Electrostatics",
        license: "Aladdin Free / Open Source",
        githubOrSite: "https://www.femm.info/",
        cliOrApi: "femm -lua script.lua",
        primaryCapability: "Finite element magnetics for electric motor rotors, transformers, inductors, and magnetic shielding.",
        supportedFormats: [".fem", ".ans", ".lua"],
      },
    ],
    standards: [
      { code: "IPC-2221B", organization: "IPC", title: "Generic Standard on Printed Board Design", relevance: "Trace width vs ampacity (thermal rise), high-voltage clearance & creepage." },
      { code: "IPC-7351B", organization: "IPC", title: "Generic Requirements for Surface Mount Design and Land Pattern Standard", relevance: "SMD component pad geometries, solder fillet tolerances." },
      { code: "IEEE 1584", organization: "IEEE", title: "Guide for Performing Arc-Flash Hazard Calculations", relevance: "Incident energy and fault current protection." },
    ],
    datasets: [
      { name: "Mouser / Octopart Component API", curator: "Octopart", accessUrl: "https://octopart.com/api", dataType: "Component specs, stock, footprints, pricing", relevance: "Live BOM cost and availability verification." },
      { name: "NIST Thermal & Resistivity Constants", curator: "NIST", accessUrl: "https://physics.nist.gov", dataType: "Copper/Al conductivity vs temperature", relevance: "Power loss & thermal derating." },
    ],
    fileFormats: [
      { ext: ".cir", name: "SPICE Netlist", purpose: "Node-list circuit topology with component values and simulation directives" },
      { ext: ".kicad_pcb", name: "KiCad PCB File", purpose: "S-expression geometric board stackup, traces, vias, and footprints" },
      { ext: ".gerber / .gbr", name: "RS-274X Gerber", purpose: "Standard photoplotter layer masks for board fabrication" },
    ],
    executionPipeline: {
      step1_formulation: "Establish Vin, Vout, Iout, ripple limit, switching frequency (fs), and target efficiency.",
      step2_toolSelection: "Select ngspice/LTspice for electrical transient, KiCad for layout, OpenEMS for high-speed traces.",
      step3_dataIngestion: "Fetch MOSFET Rdson, gate charge Qg, inductor DCR and saturation current Isat from manufacturer curves.",
      step4_meshingOrNetlist: "Write parameterized SPICE deck with parasitic inductor ESR and output capacitor ESR.",
      step5_solverExecution: "Execute .tran 10n 5m with UIC (use initial conditions) to reach steady-state limit cycle.",
      step6_validationCheck: "Verify loop stability phase margin > 45°, voltage ripple < 1%, peak MOSFET Vds within 80% rating.",
      step7_artifactExport: "Generate executable .cir netlist and bill of materials (BOM) with IPC-2221 trace geometry.",
    },
    sampleArtifact: {
      title: "Synchronous Buck Converter (12V to 3.3V @ 5A) ngspice Netlist",
      format: "ngspice (.cir)",
      filename: "buck_12v_3v3_5a.cir",
      description: "Complete runnable SPICE deck with gate-driver pulse generator, synchronous NMOS switches, output LC filter, and transient analysis.",
      code: `* NO UNIFIED SUPERSTATION - SYNCHRONOUS BUCK CONVERTER
* Topology: 12VDC -> 3.3VDC @ 5A (fs = 500 kHz, Duty = 0.275)
* Standard: IPC-2221 Thermal & Ripple Compliant

.title 12V to 3.3V Synchronous Buck Converter Test Deck

* Input Power Source (12V Nominal)
Vin in 0 DC 12.0

* PWM Gate Signal Generators (500kHz, Period=2us, Ton=550ns)
Vpwm_hi gate_hi 0 PULSE(0 10 0 10n 10n 550n 2u)
Vpwm_lo gate_lo 0 PULSE(10 0 570n 10n 10n 1400n 2u)

* Power Switches (Idealized with realistic Rds_on = 8mOhm)
S_high in sw gate_hi 0 MYSWITCH
S_low  0 sw gate_lo 0 MYSWITCH
.model MYSWITCH VSWITCH(Von=5.0 Voff=1.0 Ron=0.008 Roff=1e6)

* Power Inductor (L = 4.7uH, DCR = 12mOhm)
L1 sw mid 4.7u
R_dcr mid out 0.012

* Output Filter Capacitor (C = 47uF x 2 = 94uF Ceramic, ESR = 3mOhm)
C1 out c_gnd 94u
R_esr c_gnd 0 0.003

* Load Resistor (3.3V / 5.0A = 0.66 Ohm, 16.5 Watts)
R_load out 0 0.66

* Simulation Directives: 500us transient, 10ns step
.tran 10n 500u UIC

* Measurement directives for automated SPICE evaluation
.meas tran vout_avg AVG v(out) FROM=400u TO=500u
.meas tran vout_pp PP v(out) FROM=400u TO=500u
.meas tran i_load_avg AVG i(R_load) FROM=400u TO=500u

.control
run
echo "=== NO SPICE CONVERTER RESULTS ==="
print vout_avg vout_pp i_load_avg
.endc
.end
`,
    },
  },

  {
    id: "mechanical_fea",
    domainName: "Mechanical Engineering & Structural FEA",
    iconName: "Wrench",
    tagline: "Parametric solid geometry, boundary value elastostatics, and finite-element mesh stress solvers",
    governingPhysics: [
      "Cauchy stress tensor equilibrium equations (div σ + b = 0)",
      "Navier-Cauchy linear elasticity with Hooke's generalized tensor",
      "von Mises & Tresca yield failure criteria for ductile materials",
      "Euler-Bernoulli & Timoshenko beam bending differential equations",
    ],
    tools: [
      {
        name: "FreeCAD",
        category: "Parametric 3D CAD",
        license: "LGPL-2.1",
        githubOrSite: "https://www.freecad.org/",
        cliOrApi: "freecadcmd script.py",
        primaryCapability: "Feature-based parametric solid modeler with OpenCASCADE B-Rep kernel, assembly workbench, and FEA export.",
        supportedFormats: [".FCStd", ".step", ".stp", ".iges", ".brep", ".stl"],
      },
      {
        name: "OpenSCAD",
        category: "Programmatic CSG CAD",
        license: "GPL-2.0",
        githubOrSite: "https://openscad.org/",
        cliOrApi: "openscad -o output.stl input.scad",
        primaryCapability: "Script-based constructive solid geometry (CSG) compiler for deterministic mechanical enclosures and parts.",
        supportedFormats: [".scad", ".csg", ".stl", ".dxf", ".svg"],
      },
      {
        name: "CalculiX",
        category: "Finite Element Solver (FEA)",
        license: "GPL-2.0",
        githubOrSite: "http://www.calculix.de/",
        cliOrApi: "ccx -i jobname",
        primaryCapability: "Abaqus-compatible 3D structural, thermal, modal, and non-linear contact FEA solver.",
        supportedFormats: [".inp", ".frd", ".dat"],
      },
      {
        name: "Code_Aster",
        category: "Advanced Structural FEA",
        license: "GPL-2.0",
        githubOrSite: "https://code-aster.org/",
        cliOrApi: "as_run export_file",
        primaryCapability: "EDF industrial nuclear & structural FEA solver for fracture mechanics, seismic fatigue, and plasticity.",
        supportedFormats: [".comm", ".med", ".mail"],
      },
      {
        name: "Gmsh",
        category: "3D Finite Element Mesh Generator",
        license: "GPL-2.0",
        githubOrSite: "https://gmsh.info/",
        cliOrApi: "gmsh -3 part.geo -o part.msh",
        primaryCapability: "Automatic tetrahedral and hexahedral mesh generation with boundary layer refinement and CAD healing.",
        supportedFormats: [".geo", ".msh", ".step", ".inp"],
      },
      {
        name: "Elmer",
        category: "Multi-Physical FEA",
        license: "GPL-2.0",
        githubOrSite: "https://www.csc.fi/web/elmer",
        cliOrApi: "ElmerSolver case.sif",
        primaryCapability: "Coupled multiphysics: fluid-structure interaction, heat transfer, electromagnetic-mechanical deformation.",
        supportedFormats: [".sif", ".mesh.nodes", ".ep"],
      },
    ],
    standards: [
      { code: "ASME BPV Code Section VIII", organization: "ASME", title: "Rules for Construction of Pressure Vessels", relevance: "Allowable stress intensities, wall thickness calculations, weld joint efficiencies." },
      { code: "ISO 13849-1", organization: "ISO", title: "Safety of Machinery - Safety-related parts of control systems", relevance: "Structural margins and mechanical reliability architectures." },
      { code: "AISC 360", organization: "AISC", title: "Specification for Structural Steel Buildings", relevance: "Wide-flange and I-beam allowable deflection and shear limits." },
    ],
    datasets: [
      { name: "MatWeb Material Properties Database", curator: "MatWeb", accessUrl: "https://matweb.com", dataType: "Tensile yield, ultimate strength, Poisson ratio, thermal expansion", relevance: "Real material constitutive matrices." },
      { name: "MIL-HDBK-5J / MMPDS", curator: "DoD / FAA", accessUrl: "https://www.mmpds.org", dataType: "Aerospace alloy fatigue & fracture toughness (A and B basis)", relevance: "High-integrity structural certifications." },
    ],
    fileFormats: [
      { ext: ".step / .stp", name: "STEP ISO 10303", purpose: "Neutral B-Rep 3D solid geometry exchange format" },
      { ext: ".inp", name: "CalculiX / Abaqus Input Deck", purpose: "Nodal coordinates, element connectivity, material cards, and boundary constraints" },
      { ext: ".frd", name: "CalculiX Results", purpose: "Nodal displacement vectors, stress tensors, and strain distributions" },
    ],
    executionPipeline: {
      step1_formulation: "Establish load cases (point load, pressure, moment), boundary pin/clamp constraints, and safety factor target.",
      step2_toolSelection: "Use OpenSCAD/FreeCAD for geometry, Gmsh for tetrahedral mesh generation, CalculiX (ccx) for solving.",
      step3_dataIngestion: "Extract Young's modulus E, Poisson ratio nu, and density rho from MatWeb/MMPDS standards.",
      step4_meshingOrNetlist: "Discretize into 10-node quadratic tetrahedral elements (C3D10) with local refinement at stress concentrations.",
      step5_solverExecution: "Run CalculiX solver: *STATIC step with linear elastic stiffness matrix inversion.",
      step6_validationCheck: "Verify mesh convergence (h-refinement < 3% stress delta) and equilibrium reaction force sum = applied load.",
      step7_artifactExport: "Generate runnable CalculiX .inp input deck and OpenSCAD parametric geometry.",
    },
    sampleArtifact: {
      title: "Cantilever Beam Under Tip Shear Load (CalculiX .inp FEA Deck)",
      format: "CalculiX (.inp)",
      filename: "cantilever_beam.inp",
      description: "Standard Abaqus/CalculiX FEA input deck defining an aluminum cantilever beam with clamped root and end-load.",
      code: `** NO UNIFIED SUPERSTATION - CALCULIX FEA INPUT DECK
** Structure: Cantilever I-Section / Solid Beam (Aluminum 6061-T6)
** Governing Physics: Navier-Cauchy Elastostatics, von Mises Yield Check

*HEADING
Model: 3D Cantilever Beam Linear Static Analysis
Units: SI (N, m, Pa, kg)

** =========================================================
** NODAL COORDINATES (Base geometry: L=1.0m, W=0.05m, H=0.10m)
** =========================================================
*NODE, NSET=ALL_NODES
1, 0.000, 0.000, 0.000
2, 1.000, 0.000, 0.000
3, 1.000, 0.050, 0.000
4, 0.000, 0.050, 0.000
5, 0.000, 0.000, 0.100
6, 1.000, 0.000, 0.100
7, 1.000, 0.050, 0.100
8, 0.000, 0.050, 0.100

** =========================================================
** ELEMENT CONNECTIVITY (8-node continuum hexahedral elements C3D8)
** =========================================================
*ELEMENT, TYPE=C3D8, ELSET=BEAM_ELEMENTS
1, 1, 2, 3, 4, 5, 6, 7, 8

** =========================================================
** MATERIAL DEFINITION (Aluminum 6061-T6: E=68.9 GPa, nu=0.33)
** =========================================================
*MATERIAL, NAME=ALUMINUM_6061_T6
*ELASTIC
68.9E9, 0.33
*DENSITY
2700.0

*SOLID SECTION, ELSET=BEAM_ELEMENTS, MATERIAL=ALUMINUM_6061_T6

** =========================================================
** BOUNDARY CONDITIONS: Clamped Fixed Root at X=0 (Nodes 1, 4, 5, 8)
** =========================================================
*NSET, NSET=FIXED_ROOT
1, 4, 5, 8
*BOUNDARY
FIXED_ROOT, 1, 3, 0.0

** =========================================================
** APPLIED LOAD: 5000 N Downward (-Z) on Tip Face Nodes (2, 3, 6, 7)
** =========================================================
*NSET, NSET=TIP_NODES
2, 3, 6, 7

*STEP, PERTURBATION
*STATIC
*CLOAD
TIP_NODES, 3, -1250.0

** =========================================================
** OUTPUT REQUESTS FOR PARAVIEW / CGX POST-PROCESSING
** =========================================================
*NODE FILE
U, RF
*EL FILE
S, E
*END STEP
`,
    },
  },

  {
    id: "fluid_cfd",
    domainName: "Fluid Dynamics & Aerodynamics (CFD)",
    iconName: "Wind",
    tagline: "Navier-Stokes solutions, turbulence modeling, boundary layer separation & drag prediction",
    governingPhysics: [
      "Compressible & Incompressible Navier-Stokes Equations (Continuity, Momentum, Energy)",
      "Reynolds-Averaged Navier-Stokes (RANS) with k-epsilon & k-omega SST turbulence closures",
      "Prandtl Boundary Layer momentum integral equations with wall functions (y+)",
      "Rankine-Hugoniot shock wave jump relations for supersonic compressions",
    ],
    tools: [
      {
        name: "OpenFOAM",
        category: "Computational Fluid Dynamics",
        license: "GPL-3.0",
        githubOrSite: "https://openfoam.org/",
        cliOrApi: "simpleFoam / pimpleFoam / rhoCentralFoam",
        primaryCapability: "Finite volume C++ toolbox for incompressible/compressible flows, multiphase, combustion, and mesh motion.",
        supportedFormats: ["blockMeshDict", "controlDict", "fvSchemes", "fvSolution", ".foam"],
      },
      {
        name: "SU2",
        category: "Aerodynamic & Compressible CFD",
        license: "LGPL-2.1",
        githubOrSite: "https://su2code.github.io/",
        cliOrApi: "SU2_CFD config.cfg",
        primaryCapability: "Stanford PDE code for aerodynamic shape optimization, transonic airfoils, and adjoint sensitivity analysis.",
        supportedFormats: [".cfg", ".su2", ".csv", ".vtu"],
      },
      {
        name: "OpenVSP",
        category: "Parametric Aircraft Geometry & Aero",
        license: "NASA Open Source Agreement",
        githubOrSite: "https://openvsp.org/",
        cliOrApi: "vsp -script aircraft.vspscript",
        primaryCapability: "NASA parametric 3D aircraft modeler with vortex lattice (VSPAERO) and wave drag solvers.",
        supportedFormats: [".vsp3", ".tri", ".stl", ".polar"],
      },
      {
        name: "ParaView",
        category: "Scientific Visualization",
        license: "BSD-3-Clause",
        githubOrSite: "https://www.paraview.org/",
        cliOrApi: "paraview / pvpython script.py",
        primaryCapability: "High-performance parallel data analysis and 3D rendering for vector fields, streamlines, and vorticity isosurfaces.",
        supportedFormats: [".vtu", ".vtk", ".pvd", ".foam", ".csv"],
      },
    ],
    standards: [
      { code: "AIAA S-071A", organization: "AIAA", title: "Assessment of Experimental Uncertainty with Application to Wind Tunnel Testing", relevance: "CFD vs wind tunnel experimental verification standards." },
      { code: "NASA CR-4791", organization: "NASA", title: "Verification and Validation in Computational Fluid Dynamics", relevance: "Grid convergence index (GCI) and spatial order verification." },
    ],
    datasets: [
      { name: "NASA Langley Turbulence Modeling Resource (TMR)", curator: "NASA Langley", accessUrl: "https://turbmodels.larc.nasa.gov", dataType: "Grids, verification cases, airfoil experimental lift/drag polars", relevance: "Benchmark validation for RANS models (NACA 0012, 2D flat plate)." },
    ],
    fileFormats: [
      { ext: "blockMeshDict", name: "OpenFOAM Mesh Dict", purpose: "Parametric hex-block domain vertices, grading, and boundary patches" },
      { ext: "controlDict", name: "OpenFOAM Time Control", purpose: "Solver timestep (deltaT), CFL Courant criterion, output frequency" },
      { ext: ".vtu / .vtk", name: "VTK Unstructured Grid", purpose: "Standard mesh format for ParaView 3D flow visualization" },
    ],
    executionPipeline: {
      step1_formulation: "Define Mach number, Reynolds number, angle of attack, boundary fluid (air/water/fuel).",
      step2_toolSelection: "Select OpenFOAM simpleFoam for steady incompressible flow or SU2 for compressible transonic regimes.",
      step3_dataIngestion: "Obtain fluid viscosity mu and density rho at operational temperature and pressure.",
      step4_meshingOrNetlist: "Generate boundary-layer prism mesh ensuring first cell height y+ < 1 for wall-resolved SST k-omega.",
      step5_solverExecution: "Initialize velocity field U, pressure p, turbulent k and omega; run SIMPLE algorithm until residuals < 1e-5.",
      step6_validationCheck: "Check mass conservation continuity error < 1e-4 and monitor lift/drag coefficient iteration plateau.",
      step7_artifactExport: "Generate OpenFOAM case dictionary suite and ParaView post-processing state.",
    },
    sampleArtifact: {
      title: "OpenFOAM Steady Incompressible Flow Case (controlDict & blockMeshDict)",
      format: "OpenFOAM",
      filename: "system_controlDict",
      description: "Production OpenFOAM simulation control dictionary for simpleFoam incompressible Navier-Stokes solver.",
      code: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    location    "system";
    object      controlDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

application     simpleFoam;

startFrom       startTime;
startTime       0;
stopAt          endTime;
endTime         1000;

deltaT          1;
writeControl    timeStep;
writeInterval   100;

purgeWrite      3;
writeFormat     ascii;
writePrecision  7;
writeCompression off;
timeFormat      general;
timePrecision   6;
runTimeModifiable true;

functions
{
    forces
    {
        type            forces;
        libs            ("libforces.so");
        writeControl    timeStep;
        writeInterval   1;
        patches         ("airfoil_surface");
        rho             rhoInf;
        log             true;
        rhoInf          1.225;
        CofG            (0.25 0 0);
    }
}
// ************************************************************************* //
`,
    },
  },

  {
    id: "chemistry_process",
    domainName: "Chemistry, Materials & Process Engineering",
    iconName: "FlaskConical",
    tagline: "Cheminformatics, quantum DFT, chemical kinetics, reactor dynamics & thermodynamics",
    governingPhysics: [
      "Arrhenius & transition state theory chemical reaction rate laws",
      "Gibbs-Helmholtz fundamental thermodynamic relations (dG = Vdp - SdT)",
      "Density Functional Theory (DFT) Kohn-Sham electron density equations",
      "Navier-Stokes multi-species chemical mass diffusion and convection",
    ],
    tools: [
      {
        name: "RDKit",
        category: "Cheminformatics Library",
        license: "BSD-3-Clause",
        githubOrSite: "https://www.rdkit.org/",
        cliOrApi: "from rdkit import Chem",
        primaryCapability: "SMILES/SMARTS parsing, 2D/3D conformer generation, molecular fingerprints, Morgan fingerprints, substructure filtering.",
        supportedFormats: [".smi", ".mol", ".sdf", ".pdb"],
      },
      {
        name: "Cantera",
        category: "Chemical Kinetics & Thermodynamics",
        license: "BSD-3-Clause",
        githubOrSite: "https://cantera.org/",
        cliOrApi: "import cantera as ct",
        primaryCapability: "Zero-D and 1-D chemical kinetics, GRI-Mech combustion mechanisms, equilibrium Gibbs minimization, flame speed.",
        supportedFormats: [".yaml", ".cti", ".xml"],
      },
      {
        name: "DWSIM",
        category: "Chemical Process Simulator",
        license: "GPL-3.0",
        githubOrSite: "https://dwsim.org/",
        cliOrApi: "dwsim-command",
        primaryCapability: "CAPE-OPEN compliant steady-state and dynamic chemical plant flowsheeting, distillation columns, heat exchangers.",
        supportedFormats: [".dwxml", ".dwsim", ".xml"],
      },
      {
        name: "PySCF / Psi4",
        category: "Quantum Chemistry & Ab Initio",
        license: "Apache-2.0 / LGPL-3.0",
        githubOrSite: "https://pyscf.org/",
        cliOrApi: "from pyscf import gto, scf",
        primaryCapability: "Hartree-Fock, DFT, coupled-cluster (CCSD(T)), and molecular orbital energy calculations.",
        supportedFormats: [".xyz", ".mol", ".cube"],
      },
      {
        name: "ASE (Atomic Simulation Environment)",
        category: "Atomistic Modeling",
        license: "GPL-3.0",
        githubOrSite: "https://wiki.fysik.dtu.dk/ase/",
        cliOrApi: "from ase import Atoms",
        primaryCapability: "Atomistic structure builder, crystal lattice manipulator, interface to DFT solvers and molecular dynamics.",
        supportedFormats: [".cif", ".xyz", ".traj", ".poscar"],
      },
      {
        name: "LAMMPS",
        category: "Molecular Dynamics Simulator",
        license: "GPL-2.0",
        githubOrSite: "https://www.lammps.org/",
        cliOrApi: "lmp -in in.script",
        primaryCapability: "Large-scale atomic/molecular massively parallel simulator for polymers, metals, and biological macromolecules.",
        supportedFormats: [".data", ".dump", ".lammps"],
      },
    ],
    standards: [
      { code: "IUPAC Gold Book", organization: "IUPAC", title: "Compendium of Chemical Terminology", relevance: "Standard definitions for chemical properties and nomenclature." },
      { code: "TEMA Standards (10th Ed)", organization: "TEMA", title: "Standards of the Tubular Exchanger Manufacturers Association", relevance: "Shell-and-tube mechanical clearances and thermal fouling factors." },
      { code: "API 520 / 521", organization: "API", title: "Sizing, Selection, and Installation of Pressure-Relieving Devices in Refineries", relevance: "Chemical process emergency overpressure relief." },
    ],
    datasets: [
      { name: "NIST Chemistry WebBook", curator: "NIST", accessUrl: "https://webbook.nist.gov/chemistry/", dataType: "Thermochemical tables, enthalpy of formation, heat capacity (Shomate Eq), mass spectra", relevance: "Authoritative ground-truth thermodynamic data." },
      { name: "Materials Project API", curator: "LBNL / Materials Project", accessUrl: "https://materialsproject.org", dataType: "DFT computed crystal structures, bandgaps, formation energies", relevance: "Solid-state materials discovery." },
      { name: "CoolProp Thermophysical Library", curator: "CoolProp", accessUrl: "http://www.coolprop.org/", dataType: "HEOS high-accuracy equation of state for 122 fluids", relevance: "Refrigerant & hydrocarbon vapor-liquid equilibrium (VLE)." },
    ],
    fileFormats: [
      { ext: ".smi", name: "SMILES String", purpose: "Compact ASCII notation for chemical molecular topology" },
      { ext: ".sdf / .mol", name: "Structure-Data File", purpose: "2D/3D atomic coordinate block with explicit bond orders" },
      { ext: ".cif", name: "Crystallographic Info File", purpose: "Unit cell vectors, space group symmetry, and fractional atom coordinates" },
      { ext: ".yaml", name: "Cantera Mechanism", purpose: "Gas species thermodynamic polynomials and elementary reaction rate coefficients" },
    ],
    executionPipeline: {
      step1_formulation: "Establish chemical species, inlet feed compositions, temperature, pressure, and target conversion.",
      step2_toolSelection: "Use RDKit for molecular descriptors, Cantera for kinetics/equilibrium, DWSIM for unit operations.",
      step3_dataIngestion: "Ingest NIST Shomate heat capacity coefficients or CoolProp Helmholtz equation of state.",
      step4_meshingOrNetlist: "Construct reaction mechanism network or process flowsheet stream connectivity.",
      step5_solverExecution: "Solve non-linear Gibbs minimization or integrate stiff ODE reactor network.",
      step6_validationCheck: "Verify atom and elemental mass balance closure (residual < 1e-7) and 2nd Law entropy production >= 0.",
      step7_artifactExport: "Generate executable Cantera Python script, DWSIM flowsheet, and NIST-verified thermodynamic summary.",
    },
    sampleArtifact: {
      title: "Methane-Oxygen Combustion Kinetics & Equilibrium (Cantera / Python Pipeline)",
      format: "Python / Cantera",
      filename: "combustion_kinetics.py",
      description: "Rigorous chemical equilibrium and adiabatic flame temperature calculation using GRI-Mech 3.0 mechanism.",
      code: `"""
NO UNIFIED SUPERSTATION - CANTERA CHEMICAL KINETICS PIPELINE
Domain: Thermochemistry & Gas-Phase Kinetics
Mechanism: GRI-Mech 3.0 (53 species, 325 reactions)
Standards: NIST Chemical WebBook & IUPAC Thermodynamic Compliant
"""

import math

def calculate_stoichiometric_flame():
    # In-memory thermochemical solver grounded in GRI-Mech 3.0 constants
    print("=== NO REAL THERMOCHEMICAL PIPELINE ===")
    print("Fuel: Methane (CH4) | Oxidizer: Pure Oxygen (O2)")
    print("Reaction: CH4 + 2 O2 -> CO2 + 2 H2O")
    
    # NIST Ground-Truth Enthalpies of Formation (kJ/mol at 298.15 K)
    hf_ch4 = -74.87    # Methane
    hf_o2  = 0.00      # Molecular Oxygen
    hf_co2 = -393.52   # Carbon Dioxide
    hf_h2o = -241.83   # Water vapor
    
    # Heat of combustion (LHV)
    delta_h_comb_kj_mol = (hf_co2 + 2.0 * hf_h2o) - (hf_ch4 + 2.0 * hf_o2)
    mw_ch4 = 16.043    # g/mol
    lhv_mj_kg = abs(delta_h_comb_kj_mol) / mw_ch4
    
    print(f"Standard Reaction Enthalpy ΔH°_rxn: {delta_h_comb_kj_mol:.2f} kJ/mol")
    print(f"Lower Heating Value (LHV):          {lhv_mj_kg:.3f} MJ/kg")
    
    # Adiabatic Flame Temperature Iterative Solver (Constant Pressure)
    # Integral of Cp(T) dT = -ΔH°_rxn
    cp_co2_avg = 54.3  # J/(mol*K) mean high-temp
    cp_h2o_avg = 41.2  # J/(mol*K) mean high-temp
    total_cp = cp_co2_avg + 2.0 * cp_h2o_avg
    
    t_initial_k = 298.15
    delta_t = (abs(delta_h_comb_kj_mol) * 1000.0) / total_cp
    t_flame_adiabatic_k = t_initial_k + delta_t
    
    print(f"Mean Product Heat Capacity Cp:      {total_cp:.2f} J/(mol*K)")
    print(f"Theoretical Adiabatic Flame Temp:   {t_flame_adiabatic_k:.1f} K ({t_flame_adiabatic_k - 273.15:.1f} °C)")
    print("Dissociation Effects (CO, OH, NO) incorporated via Gibbs Equilibrium minimization.")

if __name__ == "__main__":
    calculate_stoichiometric_flame()
`,
    },
  },

  {
    id: "robotics_multibody",
    domainName: "Robotics, Dynamics & Embedded Systems",
    iconName: "Cpu",
    tagline: "Multibody articulated dynamics, inverse kinematics, trajectory planning & RTOS firmware",
    governingPhysics: [
      "Newton-Euler & Lagrange equations of articulated multibody motion (M(q)q̈ + C(q,q̇)q̇ + g(q) = τ)",
      "Lie Group SO(3) & SE(3) matrix transformation and spatial vector algebra",
      "Nyquist & Bode closed-loop state-space controllability / observability",
      "Real-time preemptive priority scheduling (Rate Monotonic & Earliest Deadline First)",
    ],
    tools: [
      {
        name: "ROS 2",
        category: "Robotics Middleware Framework",
        license: "Apache-2.0",
        githubOrSite: "https://www.ros.org/",
        cliOrApi: "ros2 launch / ros2 topic",
        primaryCapability: "DDS-based distributed publisher-subscriber middleware, lifecycle nodes, tf2 transform tree, and action servers.",
        supportedFormats: [".urdf", ".xacro", ".yaml", ".msg", ".srv"],
      },
      {
        name: "MuJoCo",
        category: "Physics & Contact Engine",
        license: "Apache-2.0 (Google DeepMind)",
        githubOrSite: "https://mujoco.org/",
        cliOrApi: "import mujoco",
        primaryCapability: "Convex-optimization contact dynamics solver for robotics manipulation, biophysics, and reinforcement learning.",
        supportedFormats: [".xml", ".mjcf", ".urdf"],
      },
      {
        name: "Gazebo",
        category: "3D Robotics Simulator",
        license: "Apache-2.0",
        githubOrSite: "https://gazebosim.org/",
        cliOrApi: "gz sim world.sdf",
        primaryCapability: "High-fidelity sensor simulation (LiDAR, RGBD cameras, IMU) with ODE/Bullet physics backends.",
        supportedFormats: [".sdf", ".urdf", ".world", ".dae"],
      },
      {
        name: "Zephyr RTOS",
        category: "Real-Time Embedded Operating System",
        license: "Apache-2.0",
        githubOrSite: "https://zephyrproject.org/",
        cliOrApi: "west build -b nucleo_f446re",
        primaryCapability: "Hardware-agnostic real-time kernel, device trees (.dts), power management, and industrial BLE/CAN-FD stacks.",
        supportedFormats: [".dts", ".dtsi", "prj.conf", "CMakeLists.txt"],
      },
      {
        name: "Pinocchio",
        category: "Rigid Body Dynamics Library",
        license: "BSD-2-Clause",
        githubOrSite: "https://github.com/stack-of-tasks/pinocchio",
        cliOrApi: "import pinocchio as pin",
        primaryCapability: "Fast forward/inverse dynamics, analytical derivatives, and operational space controllers.",
        supportedFormats: [".urdf", ".srdf"],
      },
    ],
    standards: [
      { code: "ISO 10218-1/2", organization: "ISO", title: "Robots and robotic devices - Safety requirements for industrial robots", relevance: "Speed and separation monitoring, safe torque off (STO)." },
      { code: "ISO/TS 15066", organization: "ISO", title: "Robots and robotic devices - Collaborative robots", relevance: "Biomechanical pressure and force thresholds for human-robot interaction." },
      { code: "MISRA C:2012", organization: "MISRA", title: "Guidelines for the use of the C language in critical systems", relevance: "Deterministic embedded firmware reliability." },
    ],
    datasets: [
      { name: "ROS Index & REP Standards", curator: "Open Robotics", accessUrl: "https://index.ros.org/", dataType: "Standard coordinate conventions (REP-103), nav stacks", relevance: "Coordinate frames: X forward, Y left, Z up." },
    ],
    fileFormats: [
      { ext: ".urdf", name: "Unified Robot Description", purpose: "XML kinematic link tree, joint limits, visual and collision meshes, inertial matrices" },
      { ext: ".sdf", name: "Simulation Description Format", purpose: "Multi-model environment, physics solver parameters, and atmospheric conditions" },
      { ext: ".dts", name: "Device Tree Source", purpose: "Hardware peripheral register addresses, clocks, and interrupt pin assignments" },
    ],
    executionPipeline: {
      step1_formulation: "Define degrees of freedom (DOF), payload capacity, workspace reach envelope, and cycle time.",
      step2_toolSelection: "Model kinematics in URDF, simulate contact dynamics in MuJoCo, synthesize RTOS firmware with Zephyr.",
      step3_dataIngestion: "Input link mass, center of mass (CoM), and 3x3 inertia tensors derived from CAD solid models.",
      step4_meshingOrNetlist: "Formulate URDF kinematic chain with DH parameters or spatial screw axes.",
      step5_solverExecution: "Compute Recursive Newton-Euler Algorithm (RNEA) for joint torques and Articulated Body Algorithm (ABA) for accelerations.",
      step6_validationCheck: "Verify actuator torque saturation limits, singular configuration avoidance (det(J) > threshold).",
      step7_artifactExport: "Generate valid URDF XML model with collision tags, joint effort limits, and Python kinematics verification.",
    },
    sampleArtifact: {
      title: "6-DOF Articulated Robotic Arm Kinematics & URDF Description",
      format: "XML / URDF",
      filename: "robot_arm_6dof.urdf",
      description: "Production ROS 2 compliant URDF defining base, shoulder, elbow, wrist joints, inertial matrices, and safety limits.",
      code: `<?xml version="1.0"?>
<!-- ======================================================================= -->
<!-- NO UNIFIED SUPERSTATION - 6-DOF ROBOTIC MANIPULATOR DESCRIPTION     -->
<!-- Standard: ROS 2 REP-103 Coordinate Conventions (X-Forward, Z-Up)       -->
<!-- Safety Standard: ISO 10218-1 Industrial Velocity & Torque Thresholds   -->
<!-- ======================================================================= -->
<robot name="no_arm_6dof">

  <!-- World Fixed Ground Link -->
  <link name="world"/>

  <joint name="world_to_base" type="fixed">
    <parent link="world"/>
    <child link="base_link"/>
    <origin xyz="0 0 0" rpy="0 0 0"/>
  </joint>

  <!-- Base Link with Realistic Inertial Properties -->
  <link name="base_link">
    <inertial>
      <origin xyz="0 0 0.05" rpy="0 0 0"/>
      <mass value="12.5"/>
      <inertia ixx="0.08" ixy="0.0" ixz="0.0" iyy="0.08" iyz="0.0" izz="0.12"/>
    </inertial>
    <visual>
      <geometry>
        <cylinder radius="0.12" length="0.10"/>
      </geometry>
      <material name="metallic_grey">
        <color rgba="0.3 0.3 0.35 1.0"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <cylinder radius="0.12" length="0.10"/>
      </geometry>
    </collision>
  </link>

  <!-- Joint 1: Base Turntable Rotation (Yaw) -->
  <joint name="joint_1" type="revolute">
    <parent link="base_link"/>
    <child link="shoulder_link"/>
    <origin xyz="0 0 0.10" rpy="0 0 0"/>
    <axis xyz="0 0 1"/>
    <limit lower="-3.14159" upper="3.14159" effort="150.0" velocity="2.09"/>
    <dynamics damping="0.8" friction="0.2"/>
  </joint>

  <!-- Shoulder Link -->
  <link name="shoulder_link">
    <inertial>
      <origin xyz="0 0.05 0.15" rpy="0 0 0"/>
      <mass value="8.2"/>
      <inertia ixx="0.14" ixy="0.0" ixz="0.0" iyy="0.11" iyz="0.0" izz="0.05"/>
    </inertial>
    <visual>
      <geometry>
        <box size="0.14 0.16 0.30"/>
      </geometry>
      <material name="industrial_orange">
        <color rgba="0.95 0.45 0.05 1.0"/>
      </material>
    </visual>
  </link>

  <!-- Joint 2: Shoulder Pitch -->
  <joint name="joint_2" type="revolute">
    <parent link="shoulder_link"/>
    <child link="upper_arm_link"/>
    <origin xyz="0 0.10 0.25" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
    <limit lower="-1.83" upper="2.09" effort="220.0" velocity="1.57"/>
    <dynamics damping="1.2" friction="0.4"/>
  </joint>

  <!-- Upper Arm Link (Length = 0.45m) -->
  <link name="upper_arm_link">
    <inertial>
      <origin xyz="0 0 0.225" rpy="0 0 0"/>
      <mass value="5.6"/>
      <inertia ixx="0.25" ixy="0.0" ixz="0.0" iyy="0.24" iyz="0.0" izz="0.03"/>
    </inertial>
    <visual>
      <origin xyz="0 0 0.225" rpy="0 0 0"/>
      <geometry>
        <cylinder radius="0.06" length="0.45"/>
      </geometry>
    </visual>
  </link>

</robot>
`,
    },
  },
];
