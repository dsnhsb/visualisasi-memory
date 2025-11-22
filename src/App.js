import React, { useState, useMemo, useEffect, useRef } from "react";

/* =========================
   Config / Initial Data (DIKEMBALIKAN KE DEFAULT INTERAKTIF)
   ========================= */
const MEMORY_SIZE = 1000;
// Blok awal sederhana: 3 blok bebas dan 1 blok terpakai
const INITIAL_BLOCKS_DEFAULT = [
    { id: 1, start: 0, size: 200, status: "free" },
    { id: 2, start: 200, size: 300, status: "busy", processId: "P1" },
    { id: 3, start: 500, size: 500, status: "free" },
];

// Partisi dari soal (untuk reset cepat jika diperlukan)
const INITIAL_BLOCKS_SOAL = [
    { id: 1, start: 0, size: 100, status: "free" },
    { id: 2, start: 100, size: 500, status: "free" },
    { id: 3, start: 600, size: 200, status: "free" },
    { id: 4, start: 800, size: 300, status: "free" },
    { id: 5, start: 1100, size: 600, status: "free" },
    { id: 6, start: 1700, size: 400, status: "free" },
];
const MEMORY_SIZE_SOAL = 2100;

const HomeIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>;
const ChipIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L3 12l5.714-2.143L11 3z"></path></svg>;
const CodeIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4m-4 4l-4 4m-4-4l-4-4m-4 4l-4-4"></path></svg>;
const MenuIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>;


/* =========================
   Memory Explanation Component (Penjelasan Metrik - Sesuai Permintaan & Dinamis)
   ========================= */
const MemoryExplanationBox = ({ analysisStats, algorithmName, currentMemorySize }) => {
    // Menghitung persentase efisiensi total dari 0 hingga 100
    const efficiencyPercentage = analysisStats.efficiency;
    
    // Fungsi untuk mendapatkan teks ringkasan yang dinamis dan terformat
    const getSummary = () => {
        const algName = algorithmName.toUpperCase();
        const internalFrag = analysisStats.internalFrag; // Nilai FI
        const externalFrag = analysisStats.externalFrag; // Nilai FE
        
        let feText;
        if (externalFrag > 0) {
            feText = `Fragmentasi eksternal sebesar <strong>${externalFrag} KB</strong> menunjukkan adanya ruang kosong yang **terpecah-pecah** dan tidak dapat digunakan untuk alokasi proses baru yang besar.`;
        } else {
             // Jika 0 KB, berarti semua memori bebas dapat digunakan
            feText = `Fragmentasi eksternal sebesar <strong>0 KB</strong> menunjukkan semua memori bebas dapat digunakan (tidak ada ruang yang terbuang karena pemecahan blok).`;
        }

        let fiText;
        // Asumsi simulator menggunakan alokasi dinamis (First/Best/Worst Fit), FI idealnya 0.
        if (internalFrag > 0) {
            fiText = `Fragmentasi internal sebesar <strong>${internalFrag} KB</strong> menunjukkan adanya ruang sisa di dalam blok yang sudah terpakai karena ukuran blok dibulatkan ke atas.`;
        } else {
            fiText = `Fragmentasi internal sebesar <strong>0 KB</strong> menunjukkan alokasi selalu tepat (tidak ada ruang sisa di dalam blok yang terpakai).`;
        }

        // Menggunakan <br/> dan <strong> untuk formatting
        return `Berdasarkan hasil simulasi menggunakan algoritma <strong>${algName}</strong>, penggunaan memori tergolong efisien dengan tingkat efisiensi sebesar <strong>${efficiencyPercentage}%</strong>.<br/><br/>
        
        Analisis Fragmentasi:<br/>
        &bull; ${fiText}<br/>
        &bull; ${feText}`;
    };

    // Menggunakan useMemo untuk memastikan ringkasan hanya dihitung ulang jika metrik berubah
    const summaryHtml = useMemo(() => getSummary(), [analysisStats, algorithmName]);

    return (
        <div className="mt-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700 shadow-inner">
            <h4 className="text-lg text-white font-semibold mb-3 border-b border-gray-700 pb-2">
                📖 Ringkasan Analisis Performa
            </h4>
            
            {/* Kunci: Menggunakan dangerouslySetInnerHTML untuk merender HTML dari string */}
            <p 
                className="text-sm text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: summaryHtml }}
            />
        </div>
    );
};


/* =========================
   Algorithm Comparison Component (Perbandingan Baru)
   ========================= */
const AlgorithmComparison = () => {
    return (
        <div className="mt-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700 shadow-inner">
            <h4 className="text-lg text-white font-semibold mb-3 border-b border-gray-700 pb-2 flex items-center">
                🏆 Perbandingan Performa Algoritma
            </h4>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700 text-left text-sm text-gray-400">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-2 font-medium text-white">Algoritma</th>
                            <th className="px-4 py-2 font-medium text-white">Kecepatan (Waktu Komputasi)</th>
                            <th className="px-4 py-2 font-medium text-white">Fragmentasi Eksternal</th>
                            <th className="px-4 py-2 font-medium text-white">Kesimpulan (Ideal untuk)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        <tr className="hover:bg-gray-800/50 transition">
                            <td className="px-4 py-2 font-semibold text-blue-400">First Fit</td>
                            <td className="px-4 py-2 text-green-400">Cepat (Low Overhead)</td>
                            <td className="px-4 py-2 text-yellow-400">Sedang hingga Tinggi</td>
                            <td className="px-4 py-2">Sistem yang membutuhkan respons cepat.</td>
                        </tr>
                        <tr className="hover:bg-gray-800/50 transition">
                            <td className="px-4 py-2 font-semibold text-blue-400">Best Fit</td>
                            <td className="px-4 py-2 text-red-400">Lambat (High Overhead)</td>
                            <td className="px-4 py-2 text-green-400">Rendah</td>
                            <td className="px-4 py-2">Pemanfaatan ruang memori yang optimal.</td>
                        </tr>
                        <tr className="hover:bg-gray-800/50 transition">
                            <td className="px-4 py-2 font-semibold text-blue-400">Worst Fit</td>
                            <td className="px-4 py-2 text-red-400">Lambat (High Overhead)</td>
                            <td className="px-4 py-2 text-red-400">Tinggi</td>
                            <td className="px-4 py-2">Menciptakan sisa blok besar (Teoritis).</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <p className="mt-4 text-sm text-gray-500 italic">
                **Mana yang Terbaik?** Secara umum, **Best Fit** sering dianggap terbaik untuk **meminimalkan Fragmentasi Eksternal**, tetapi **First Fit** adalah yang paling sering digunakan karena perpaduan yang baik antara performa kecepatan dan alokasi yang memadai.
            </p>
        </div>
    );
};


/* =========================
   Memory Simulator Component
   ========================= */
const MemorySimulator = () => {
    // Gunakan MEMORY_SIZE dan INITIAL_BLOCKS_DEFAULT
    const [memorySize, setMemorySize] = useState(MEMORY_SIZE);
    const [memoryBlocks, setMemoryBlocks] = useState(INITIAL_BLOCKS_DEFAULT);
    const [nextProcessId, setNextProcessId] = useState(2); 
    const [algorithm, setAlgorithm] = useState("first");
    const [recentlyAdded, setRecentlyAdded] = useState([]);
    const [narasi, setNarasi] = useState("Simulasi dimulai dengan 1000 KB memori. P1 terisi 300 KB.");

    // State BATCH yang DIKEMBALIKAN
    const [batchInput, setBatchInput] = useState("312, 196, 80, 486, 550, 266"); // Default soal untuk kemudahan
    const [batchProcesses, setBatchProcesses] = useState([]);

    
    const sortBlocks = (blocks) => [...blocks].sort((a, b) => a.start - b.start);

    const coalesceFreeBlocks = (blocks) => {
        const sorted = sortBlocks(blocks);
        const result = [];
        for (let i = 0; i < sorted.length; i++) {
            const b = sorted[i];
            if (result.length === 0) {
                result.push({ ...b });
            } else {
                const last = result[result.length - 1];
                if (last.status === "free" && b.status === "free" && last.start + last.size === b.start) {
                    last.size += b.size;
                } else {
                    result.push({ ...b });
                }
            }
        }
        return result;
    };

    const findTargetIndexByAlgorithm = (blocks, sizeNum, algo) => {
        const freeBlocks = blocks
            .map((b, idx) => ({ block: b, idx }))
            .filter(({ block }) => block.status === "free" && block.size >= sizeNum);

        if (!freeBlocks.length) return -1;
        if (algo === "first") return freeBlocks[0].idx;
        if (algo === "best") {
            const best = freeBlocks.reduce((bestItem, current) => (current.block.size < bestItem.block.size ? current : bestItem), freeBlocks[0]);
            return best.idx;
        }
        if (algo === "worst") {
            const worst = freeBlocks.reduce((worstItem, current) => (current.block.size > worstItem.block.size ? current : worstItem), freeBlocks[0]);
            return worst.idx;
        }
        return -1;
    };

    const allocateMemory = (size, isBatch = false) => {
        const sizeNum = parseInt(size, 10);
        
        if (isNaN(sizeNum) || sizeNum <= 0) {
            setNarasi("Ukuran tidak valid.\nMasukkan nilai positif yang benar.");
            return alert("Ukuran proses tidak valid.");
        }
        
        const idx = findTargetIndexByAlgorithm(memoryBlocks, sizeNum, algorithm);
        
        if (idx === -1) {
            setNarasi(`Alokasi gagal untuk ${sizeNum} KB.\nTidak ditemukan blok memori yang sesuai.`);
            if (!isBatch) alert(`Alokasi gagal. Ukuran ${sizeNum} KB tidak muat di blok bebas manapun.`);
            return false;
        }

        const pid = nextProcessId;
        const blocksCopy = [...memoryBlocks];
        const target = blocksCopy[idx];

        const newId = Date.now() + Math.floor(Math.random() * 1000);
        const alloc = {
            id: newId,
            start: target.start,
            size: sizeNum,
            status: "busy",
            processId: `P${pid}`,
        };

        const remaining = target.size - sizeNum;
        if (remaining > 0) {
            blocksCopy.splice(idx, 1, alloc, {
                id: newId + 1,
                start: target.start + sizeNum,
                size: remaining,
                status: "free",
            });
        } else {
            blocksCopy.splice(idx, 1, alloc);
        }

        const sorted = sortBlocks(blocksCopy);
        setMemoryBlocks(sorted);
        
        setNextProcessId((p) => p + 1); 
        
        // setNewProcessSize(""); // Dihapus karena input tunggal hilang

        setRecentlyAdded((r) => [...r, alloc.id]);
        setTimeout(() => {
            setRecentlyAdded((r) => r.filter((id) => id !== alloc.id));
        }, 900);

        setNarasi(`Proses P${pid} (${sizeNum} KB) berhasil dialokasikan.`);
        return true;
    };

    const deallocateMemory = (pid) => {
        const n = memoryBlocks.map((b) => (b.processId === pid ? { ...b, status: "free", processId: undefined } : { ...b }));
        const merged = coalesceFreeBlocks(n);
        setMemoryBlocks(merged);
        setNarasi(`Proses ${pid} dibebaskan.\nBlok kosong digabung otomatis.`);
    };
    
    // --- FUNGSI BATCH & RESET DITINGKATKAN ---
    const processBatch = () => {
        const cleanInput = batchInput.replace(/\s/g, '').split(',').filter(n => n).map(Number);
        
        if (cleanInput.length === 0 || cleanInput.some(isNaN) || cleanInput.some(n => n <= 0)) {
            setNarasi("Input Batch tidak valid. Masukkan daftar angka positif yang dipisahkan koma.");
            return;
        }

        setBatchProcesses(cleanInput);
        setNarasi(`Daftar ${cleanInput.length} proses siap dialokasikan: ${cleanInput.join(', ')} KB.`);
    };

    const allocateNextBatch = () => {
        if (batchProcesses.length === 0) {
            setNarasi("Antrian proses batch kosong. Silakan masukkan daftar proses.");
            return;
        }

        const nextSize = batchProcesses[0];
        
        const success = allocateMemory(nextSize, true); // true menandakan mode batch

        if (success) {
            setBatchProcesses(prev => prev.slice(1)); 
        } else {
            // Hapus dari antrian karena gagal
            setBatchProcesses(prev => prev.slice(1));
            setNarasi(`Proses ${nextSize} KB gagal dialokasikan dan dihapus dari antrian.`);
        }
    };
    
    const resetSimulation = (useSoalData = false) => {
        if (useSoalData) {
             setMemorySize(MEMORY_SIZE_SOAL);
             setMemoryBlocks(INITIAL_BLOCKS_SOAL);
             setNarasi(`Simulasi direset ke partisi soal (2100 KB).`);
             setNextProcessId(1); 
        } else {
            setMemorySize(MEMORY_SIZE);
            setMemoryBlocks(INITIAL_BLOCKS_DEFAULT);
            setNarasi(`Simulasi direset ke mode default (1000 KB).`);
            setNextProcessId(2); 
        }
        setBatchProcesses([]);
        setBatchInput("312, 196, 80, 486, 550, 266"); // Set default batch input ke soal
    }
    // ----------------------------------------

    // ** FUNGSI ANALISIS **
    const analysisStats = useMemo(() => {
        const busyBlocks = memoryBlocks.filter((b) => b.status === "busy");
        const freeBlocks = memoryBlocks.filter((b) => b.status === "free");
        
        const totalUsed = busyBlocks.reduce((s, b) => s + b.size, 0);
        const currentMemorySize = memorySize;
        const totalFree = currentMemorySize - totalUsed;
        const efficiency = currentMemorySize > 0 ? ((totalUsed / currentMemorySize) * 100).toFixed(2) : 0;
        
        const internalFrag = 0; // Asumsi FI 0 untuk alokasi dinamis (tepat)

        const largestFreeBlock = freeBlocks.reduce((max, b) => Math.max(max, b.size), 0);
        const externalFrag = totalFree > 0 ? totalFree - largestFreeBlock : 0; 

        // Daftar Proses Aktif
        const activeProcesses = busyBlocks.map(b => ({
            pid: b.processId,
            size: b.size,
            start: b.start,
            end: b.start + b.size
        })).sort((a, b) => {
            // Sortir berdasarkan PID numerik (P1, P2, P3,...)
            const numA = parseInt(a.pid.substring(1));
            const numB = parseInt(b.pid.substring(1));
            return numA - numB;
        });
        
        return {
            totalUsed,
            totalFree,
            efficiency,
            largestFreeBlock,
            internalFrag,
            externalFrag,
            activeProcesses, 
        };
    }, [memoryBlocks, memorySize]);
    
    // Untuk tampilan statistik di visualisasi
    const stats = { used: analysisStats.totalUsed, free: analysisStats.totalFree };
    
    // Fungsi pembantu nama algoritma
    const getAlgorithmName = (algo) => {
        if (algo === 'first') return 'First Fit';
        if (algo === 'best') return 'Best Fit';
        if (algo === 'worst') return 'Worst Fit';
        return 'N/A';
    }


    const MemoryBlock = ({ block }) => {
        // Gunakan memorySize dari state untuk perhitungan persentase
        const heightPercentage = `${(block.size / memorySize) * 100}%`;
        const isFree = block.status === "free";
        const freeClass = 'bg-red-700/80 border-red-500 text-white'; 
        const busyClass = 'bg-white/90 border-gray-400 text-gray-800'; 
        const animateClass = recentlyAdded.includes(block.id) ? 'animate-bounce' : ''; 

        return (
            <div
                style={{ height: heightPercentage }}
                className={`w-full border transition-all duration-300 flex items-center justify-center text-xs font-semibold relative rounded-sm overflow-hidden p-1 ${isFree ? freeClass : busyClass} ${animateClass}`}
            >
                <div className="px-1 truncate">{isFree ? `Bebas (${block.size} KB)` : `${block.processId} (${block.size} KB)`}</div>

                {!isFree && (
                    <button
                        onClick={() => deallocateMemory(block.processId)}
                        className="absolute right-1 top-1 px-1 py-0.5 text-[8px] rounded-full bg-gray-800 text-white hover:bg-gray-700 transition"
                        title="Bebaskan Proses"
                    >
                        X
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="p-6 h-full">
            <div className="rounded-2xl p-6 shadow-2xl bg-[#161B22]/80 backdrop-blur-md border border-[#20262D]">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Memory Simulator</h2>
                        <p className="text-sm text-gray-400">First Fit, Best Fit, Worst Fit - Visualisasi Interaktif (Total Memori: {memorySize} KB)</p>
                    </div>

                    <div className="text-right text-sm text-gray-400">
                        Next PID: <span className="font-bold text-blue-400">P{nextProcessId}</span>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Visual */}
                    <div className="lg:col-span-1">
                        <div className="rounded-xl p-4 border border-[#20262D] bg-[#0D1117]">
                            <h3 className="text-lg text-white mb-3 font-semibold">Diagram Memori</h3>
                            <div className="h-[480px] rounded-lg overflow-hidden border-2 border-dashed border-gray-700 relative bg-gray-900">
                                <div className="absolute inset-0 flex flex-col-reverse">
                                    {sortBlocks(memoryBlocks).map((b) => (
                                        <MemoryBlock key={b.id} block={b} />
                                    ))}
                                </div>

                                <div className="absolute left-3 top-2 text-xs text-gray-500 font-mono flex flex-col justify-between h-full py-2">
                                    <span>{memorySize} KB</span>
                                    <span className="self-end mr-2"></span>
                                    <span>0 KB</span>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-3 text-center text-sm gap-2 text-gray-400">
                                <div>
                                    Total <br />
                                    <span className="font-bold text-white">{memorySize} KB</span>
                                </div>
                                <div>
                                    Terpakai <br />
                                    <span className="font-bold text-green-400">{stats.used} KB</span>
                                </div>
                                <div>
                                    Bebas <br />
                                    <span className="font-bold text-red-400">{stats.free} KB</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <button 
                                    onClick={resetSimulation} 
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 font-bold text-white shadow-md transition text-sm"
                                >
                                    Reset Default (1000 KB)
                                </button>
                                <button 
                                    onClick={() => resetSimulation(true)} 
                                    className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 font-bold text-white shadow-md transition text-sm"
                                >
                                    Reset Soal (2100 KB)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Controls + Analysis + List */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* KONTROL BATCH YANG MENJADI KONTROL UTAMA */}
                        <div className="rounded-xl p-6 border border-[#20262D] bg-[#0D1117] shadow-lg">
                            <h3 className="text-lg text-white mb-4 font-semibold">Simulasi Proses (Langkah Per Langkah)</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-4">
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Algoritma</label>
                                    <select
                                        value={algorithm}
                                        onChange={(e) => setAlgorithm(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 transition"
                                    >
                                        <option value="first">First Fit</option>
                                        <option value="best">Best Fit</option>
                                        <option value="worst">Worst Fit</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm text-gray-400 mb-1 block">Input Proses (Pisahkan dengan koma)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            value={batchInput}
                                            onChange={(e) => setBatchInput(e.target.value)}
                                            placeholder="312, 196, 80, 486, ..."
                                            className="col-span-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
                                        />
                                        <button
                                            onClick={processBatch}
                                            className="col-span-1 px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 font-semibold text-white text-sm transition"
                                        >
                                            Set Proses
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Tombol NEXT */}
                            <div className="border-t border-gray-700 pt-4">
                                <button
                                    onClick={allocateNextBatch}
                                    disabled={batchProcesses.length === 0}
                                    className={`w-full px-4 py-2 rounded-lg font-bold text-sm transition ${batchProcesses.length > 0 ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                                >
                                    Alokasikan Proses Selanjutnya ({batchProcesses.length} Tersisa)
                                </button>
                                {batchProcesses.length > 0 && (
                                    <p className="mt-2 text-xs text-yellow-400 text-center">
                                        Proses Berikutnya: **{batchProcesses[0]} KB**
                                    </p>
                                )}
                            </div>
                            {/* AKHIR KONTROL BATCH */}


                            {narasi && (
                                <div className="mt-4 p-4 rounded-lg bg-blue-900/40 border border-blue-700/60 text-blue-300 font-mono text-sm whitespace-pre-wrap shadow-inner">
                                    {narasi}
                                </div>
                            )}
                        </div>
                        
                        {/* --- TABEL ANALISIS PERFORMA --- */}
                        <div className="rounded-xl p-6 border border-[#20262D] bg-[#0D1117] shadow-lg">
                            <h3 className="text-lg text-white mb-4 font-semibold">Analisis Performa Memori</h3>
                            
                            {/* Metrik Dasar */}
                            <div className="overflow-x-auto mb-4">
                                <table className="min-w-full divide-y divide-gray-700 text-left text-sm text-gray-400">
                                    <thead className="bg-gray-800">
                                        <tr>
                                            <th className="px-4 py-2 font-medium text-white">Metrik</th>
                                            <th className="px-4 py-2 font-medium text-white">Nilai Saat Ini</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        <tr className="hover:bg-gray-800/50 transition">
                                            <td className="px-4 py-2">Algoritma</td>
                                            <td className="px-4 py-2 font-mono text-blue-400 font-semibold">{getAlgorithmName(algorithm)}</td>
                                        </tr>
                                        <tr className="hover:bg-gray-800/50 transition">
                                            <td className="px-4 py-2">Total Memori</td>
                                            <td className="px-4 py-2 font-mono text-white">{memorySize} KB</td>
                                        </tr>
                                        <tr className="hover:bg-gray-800/50 transition">
                                            <td className="px-4 py-2">Memori Terpakai</td>
                                            <td className="px-4 py-2 font-mono text-green-400">{analysisStats.totalUsed} KB</td>
                                        </tr>
                                        <tr className="hover:bg-gray-800/50 transition">
                                            <td className="px-4 py-2">Memori Bebas (Total)</td>
                                            <td className="px-4 py-2 font-mono text-red-400">{stats.free} KB</td>
                                        </tr>
                                        <tr className="hover:bg-gray-800/50 transition">
                                            <td className="px-4 py-2">Efisiensi Penggunaan Memori</td>
                                            <td className="px-4 py-2 font-mono text-white/90">{analysisStats.efficiency}%</td>
                                        </tr>
                                        <tr className="hover:bg-gray-800/50 transition">
                                            <td className="px-4 py-2">Fragmentasi Internal</td>
                                            <td className="px-4 py-2 font-mono text-yellow-500">
                                                {analysisStats.internalFrag} KB (Ideal)
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-gray-800/50 transition">
                                            <td className="px-4 py-2">Fragmentasi Eksternal*</td>
                                            <td className="px-4 py-2 font-mono text-yellow-500">
                                                {analysisStats.externalFrag} KB
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <p className="mt-3 text-xs text-gray-600 italic">*Fragmentasi Eksternal: Total memori bebas yang tersebar dan tidak dapat digunakan untuk alokasi sebesar blok terbesar yang tersedia ({analysisStats.largestFreeBlock} KB).</p>
                            </div>

                            {/* Panggil komponen Ringkasan Analisis Metrik */}
                            <MemoryExplanationBox 
                                analysisStats={analysisStats} 
                                algorithmName={getAlgorithmName(algorithm)}
                                currentMemorySize={memorySize}
                            />
                            
                            {/* Panggil komponen Perbandingan Algoritma */}
                            <AlgorithmComparison />


                            {/* Daftar Proses Aktif */}
                            <h4 className="text-md text-white mt-6 mb-3 font-semibold border-t pt-3 border-gray-700">Proses Aktif ({analysisStats.activeProcesses.length})</h4>
                            <div className="max-h-32 overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-700 text-left text-xs text-gray-400">
                                    <thead className="bg-gray-800">
                                        <tr>
                                            <th className="px-3 py-1 font-medium text-white">PID</th>
                                            <th className="px-3 py-1 font-medium text-white">Ukuran</th>
                                            <th className="px-3 py-1 font-medium text-white">Range Alamat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {analysisStats.activeProcesses.length > 0 ? (
                                            analysisStats.activeProcesses.map((p) => (
                                                <tr key={p.pid} className="hover:bg-gray-800/50 transition">
                                                    <td className="px-3 py-2 font-mono text-green-400">{p.pid}</td>
                                                    <td className="px-3 py-2 font-mono text-white">{p.size} KB</td>
                                                    <td className="px-3 py-2 font-mono text-gray-500">[{p.start} – {p.end}]</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="px-3 py-2 text-center italic text-gray-500">
                                                    Tidak ada proses yang aktif saat ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* --- AKHIR TABEL ANALISIS --- */}


                        {/* Block list */}
                        <div className="rounded-xl p-6 border border-[#20262D] bg-[#0D1117] shadow-lg">
                            <h3 className="text-lg text-white mb-4 font-semibold">Daftar Blok Memori</h3>
                            <div className="max-h-56 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                                {sortBlocks(memoryBlocks).map((b) => (
                                    <div
                                        key={b.id}
                                        className={`p-3 rounded-md flex justify-between items-center text-sm font-mono transition-colors border ${
                                            b.status === "free" ? "bg-red-900/30 border-red-700/60 text-red-300" : "bg-white/10 border-gray-700 text-white"
                                        }`}
                                    >
                                        <div>
                                            <span className="text-gray-400">[{b.start} – {b.start + b.size}]</span> • {b.size} KB •{" "}
                                            <span className={`font-bold ${b.status === "free" ? "text-red-300" : "text-white"}`}>{b.status === "free" ? 'Bebas' : b.processId}</span>
                                        </div>

                                        {b.status === "busy" && (
                                            <button onClick={() => deallocateMemory(b.processId)} className="px-3 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700 transition">
                                                Bebaskan
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Legend in the list footer */}
                            <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-700 border border-red-500" />
                                        <span className="text-gray-300">Bebas</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-white border border-gray-400" />
                                        <span className="text-gray-300">Terpakai</span>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400">Tip: Klik 'X' di visual atau tombol 'Bebaskan' di daftar.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* =========================
   Home & Developer Components
   ========================= */
const Home = () => (
    <div className="p-6 h-full">
      <div className="rounded-2xl p-6 shadow-2xl bg-[#161B22]/80 backdrop-blur-md border border-[#20262D]">
        <h1 className="text-4xl font-extrabold text-white mb-4">✨ Selamat Datang — Memory Visualizer</h1>
        <p className="text-gray-400 max-w-4xl leading-relaxed text-lg">
          Aplikasi ini berfungsi sebagai alat bantu untuk memahami konsep **Alokasi Memori Dinamis** dan dampak dari tiga algoritma utama: **First Fit**, **Best Fit**, dan **Worst Fit** dalam sistem operasi.
        </p>
  
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-lg border border-blue-700/60 bg-blue-900/20 shadow-md">
            <h3 className="text-xl text-blue-300 font-bold mb-2">Alokasi Memori</h3>
            <p className="text-gray-300 text-sm">Strategi OS mengelola dan mendistribusikan ruang RAM kepada proses yang berjalan.</p>
          </div>
          <div className="p-5 rounded-lg border border-purple-700/60 bg-purple-900/20 shadow-md">
            <h3 className="text-xl text-purple-300 font-bold mb-2">Fragmentasi</h3>
            <p className="text-gray-300 text-sm">Kondisi di mana memori bebas terpecah menjadi blok-blok kecil yang tidak dapat dialokasikan secara efektif (Eksternal/Internal).</p>
          </div>
          <div className="p-5 rounded-lg border border-green-700/60 bg-green-900/20 shadow-md">
            <h3 className="text-xl text-green-300 font-bold mb-2">Visual Interaktif</h3>
            <p className="text-gray-300 text-sm">Lacak alokasi, dealokasi, dan penggabungan blok (coalescing) secara *real-time*.</p>
          </div>
        </div>
      </div>
    </div>
);

const Developer = () => (
    <div className="p-6 h-full">
      <div className="rounded-2xl p-6 shadow-2xl bg-[#161B22]/80 backdrop-blur-md border border-[#20262D]">
        <h1 className="text-3xl font-bold text-white mb-4">👨‍💻 Developer & Info</h1>
        <p className="text-gray-400 text-lg">Visualisasi Alokasi Memori.</p>
  
        <div className="mt-6 space-y-3">
          <p className="text-gray-300 text-md">Nama Pengembang: <span className="text-white font-semibold">Mahasiswa Informatika Universitas Siliwangi </span></p>
          <p className="text-gray-300 text-md">Tahun Proyek: <span className="text-white font-semibold">2025</span></p>
          <p className="text-gray-300 text-md">Tujuan: <span className="text-white font-semibold">Aplikasi ini dibuat untuk analisis visualisasi alokasi memori .</span></p>
        </div>
      </div>
    </div>
);

/* =========================
   Sidebar Component
   ========================= */
const Sidebar = ({ page, setPage, isOpen }) => {
    const menu = [
      { id: "home", label: "Beranda", icon: <HomeIcon /> },
      { id: "memory", label: "Simulator", icon: <ChipIcon /> },
      { id: "developer", label: "Developer", icon: <CodeIcon /> },
    ];
  
    return (
      <aside
        className={`
          ${isOpen ? "w-64" : "w-20"} 
          min-h-screen p-4 border-r border-[#20262D] bg-[#0D1117] transition-all duration-300 flex flex-col
        `}
      >
        <div className={`mb-8 ${isOpen ? "px-2" : "px-0"}`}>
          <div className={`text-2xl font-bold text-blue-400 tracking-wide overflow-hidden ${!isOpen && "hidden"}`}>SpaceUI</div>
          <div className={`text-xs text-gray-500 mt-1 ${!isOpen && "hidden"}`}>Visualizer</div>
          {!isOpen && <ChipIcon className="mx-auto text-blue-400 w-8 h-8"/>}
        </div>
  
        <nav className="space-y-2 flex-grow">
          {menu.map((m) => (
            <button
              key={m.id}
              onClick={() => setPage(m.id)}
              className={`w-full flex items-center ${isOpen ? "justify-start px-4" : "justify-center px-0"} py-3 rounded-xl transition-all duration-200 ${
                page === m.id ? "bg-blue-600 text-white shadow-xl shadow-blue-900/30" : "text-gray-400 hover:bg-[#161B22] hover:text-white"
              }`}
            >
              <div className={`mr-3 ${!isOpen && "mr-0"}`}>{m.icon}</div>
              <span className={`font-semibold overflow-hidden whitespace-nowrap ${!isOpen && "hidden"}`}>{m.label}</span>
            </button>
          ))}
        </nav>
  
        <div className={`mt-auto text-xs text-gray-600 text-center ${!isOpen && "hidden"}`}>© 2025 Kelompok 5</div>
      </aside>
    );
};

/* =========================
   App (single-file container)
   ========================= */
export default function App() {
    const [page, setPage] = useState("home");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const renderPage = () => {
        if (page === "home") return <Home />;
        if (page === "memory") return <MemorySimulator />;
        if (page === "developer") return <Developer />;
        return <Home />;
    };

    return (
        <div style={{ minHeight: "100vh", fontFamily: "Inter, sans-serif", backgroundColor: '#0D1117' }} className="relative overflow-hidden text-white">
            {/* Background (Solid Dark) */}
            
            {/* Main layout */}
            <div className="flex">
                <Sidebar page={page} setPage={setPage} isOpen={isSidebarOpen} />
                
                <main className="flex-1 overflow-auto">
                    {/* Header / Toggle Button */}
                    <header className={`p-4 bg-[#161B22]/80 backdrop-blur-sm border-b border-[#20262D] sticky top-0 z-10 transition-all ${isSidebarOpen ? "ml-0" : "ml-0"}`}>
                        <button 
                            onClick={() => setIsSidebarOpen(prev => !prev)}
                            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition"
                        >
                            <MenuIcon className="w-5 h-5 text-gray-400"/>
                        </button>
                    </header>

                    {/* Page Content */}
                    <div className="fadeIn">{renderPage()}</div>
                </main>
            </div>

            {/* Tiny styles included for smoothness */}
            <style>{`
                /* Basic resets for this single-file app */
                :root { --glass: rgba(255,255,255,0.06); }
                body, html, #root { height: 100%; margin: 0; padding: 0; }
                /* Animations */
                .fadeIn { animation: fadeIn 530ms ease both; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(6px);} to { opacity:1; transform: translateY(0);} }
                /* Scrollbar subtle for dark theme */
                .scrollbar-thin::-webkit-scrollbar { width: 8px; height: 8px; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                .animate-bounce {
                    animation: bounce 1s infinite;
                }
                @keyframes bounce {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-5px);
                    }
                }
            `}</style>
        </div>
    );
}