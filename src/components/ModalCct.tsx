// import AddCategoryModal from './AddCategoryModal';
// import AddCovenantModal from './AddCovenantModal';
// import AddGuildModal from './AddGuildModal';
// export function ModalCct({
//   children,
//   modal,
//   fetchGuild,
//   fetchData,
//   covenantOptions,
//   fetchCategory,
//   covenant_id,
//   searchText,
//   guildId,
// }: {
//   children: React.ReactNode;
//   modal: string;
//   fetchGuild?: () => Promise<void>;
//   fetchData?: (name: string) => Promise<void>;
//   covenantOptions?: { name: string; id: string }[];
//   fetchCategory?: (name: string) => Promise<void>;
//   covenant_id?: string;
//   searchText?: string;
//   guildId?: string;
// }) {
//   return (
//     <>
//       {modal === 'addGuild' && fetchGuild && (
//         <AddGuildModal fetchGuild={fetchGuild} searchText={(searchText as any) ?? ''}>
//           {children}
//         </AddGuildModal>
//       )}
//       {modal === 'addCovenant' && fetchData && (
//         <AddCovenantModal fetchData={fetchData} guildId={(guildId as any) ?? ''} searchText={(searchText as any) ?? ''}>
//           {children}
//         </AddCovenantModal>
//       )}
//       {modal === 'addCategory' && covenantOptions && (
//         <AddCategoryModal
//           fetchCategory={fetchCategory}
//           covenant_id={covenant_id as any}
//           covenantOptions={covenantOptions}
//           searchText={(searchText as any) ?? ''}
//         >
//           {children}
//         </AddCategoryModal>
//       )}
//     </>
//   );
// }
